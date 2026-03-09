# 🎯 Guia de Entrevista - Cinema Booking API

## Apresentação Rápida (2 minutos)

"Desenvolvi um sistema distribuído de venda de ingressos de cinema com NestJS, focado em alta concorrência e confiabilidade. O sistema implementa controle de concorrência robusto, processamento assíncrono com Kafka, e logging estruturado."

---

## Arquitetura (Explicar em 3 minutos)

### Camadas

```
Presentation (Controllers)
    ↓
Application (Use Cases)
    ↓
Domain (Entities)
    ↓
Infrastructure (Repositories)
```

**Por quê?** Separação clara de responsabilidades, fácil de testar e manter.

### Tecnologias Principais

| Tech | Função | Por quê |
|------|--------|--------|
| **NestJS** | Framework | DI automático, módulos, decorators |
| **PostgreSQL** | Banco | ACID, locks pessimistas (FOR UPDATE) |
| **Redis** | Locks | Redlock para locks distribuídos |
| **Kafka** | Mensageria | Garantia de entrega, assíncrono |

---

## Problema Principal: Concorrência (Explicar em 5 minutos)

### O Problema

2 usuários clicam no último assento no mesmo milissegundo. Sem proteção, ambos conseguem reservar.

### A Solução: 3 Camadas de Proteção

#### 1. Lock Distribuído (Redis)

```typescript
// Antes de qualquer operação, adquire lock
await this.distributedLockService.executeWithLocks(
  ['seat:sess-123:5', 'seat:sess-123:6'],  // Chaves únicas
  async () => {
    // Código protegido aqui
  }
);
```

**Como funciona no Redis:**
```
SET lock:seat:sess-123:5 token-uuid PX 30000 NX
```
- `NX` = só set se não existir
- `PX 30000` = expira em 30 segundos
- Resultado: `OK` (sucesso) ou `nil` (bloqueado)

#### 2. Lock Pessimista (PostgreSQL)

```typescript
// Dentro da transação
const seats = await this.seatRepository.findWithPessimisticLock(
  sessionId,
  seatNumbers
);
// SQL: SELECT * FROM seats WHERE ... FOR UPDATE
```

**O que faz:** Bloqueia as linhas no banco até que a transação termine. Outro usuário não consegue ler nem modificar.

#### 3. Validação Dupla

```typescript
// Antes do lock
if (unavailableSeats.length > 0) {
  throw new SeatNotAvailableException(...);
}
```

---

## Fluxo de Reserva (Explicar em 5 minutos)

### Passo a Passo

```
1. Cliente: POST /api/v1/reservations
   {
     "sessionId": "sess-123",
     "userId": "user-456",
     "seatNumbers": [5, 6]
   }

2. Controller chama Use Case

3. Use Case:
   a) Valida se sessão existe
   b) Adquire locks distribuídos
   c) Dentro do lock:
      - Executa transação pessimista
      - Busca assentos COM LOCK
      - Valida disponibilidade
      - Cria reserva
      - Atualiza assentos para 'reserved'
   d) Libera locks

4. Publica evento Kafka 'ReservationCreated'

5. Consumer recebe evento
   - Processa idempotentemente
   - Envia email

6. Retorna resposta ao cliente
   {
     "id": "res-789",
     "status": "pending",
     "expiresAt": "2026-01-28T23:45:05Z"
   }

7. Após 30 segundos:
   - Worker detecta expiração
   - Marca como 'expired'
   - Libera assentos
```

### Código-Chave

```typescript
// Adquire locks
await this.distributedLockService.executeWithLocks(
  this.buildSeatLockResources(sessionId, seatNumbers),
  async () => {
    // Transação pessimista
    await this.unitOfWork.transactionPessimistic(async () => {
      // SELECT ... FOR UPDATE
      const seatsWithLock = await this.seatRepository
        .findWithPessimisticLock(sessionId, seatNumbers);

      // Valida
      const unavailable = seatsWithLock.filter(s => s.status !== 'available');
      if (unavailable.length > 0) {
        throw new SeatNotAvailableException(...);
      }

      // Cria e salva
      const reservation = Reservation.create({
        sessionId,
        userId,
        seatNumbers,
        totalPrice: session.getPrice().multiply(seatNumbers.length)
      });
      await this.reservationRepository.create(reservation);

      // Atualiza assentos
      for (const seat of seatsWithLock) {
        seat.updateStatus('reserved');
        await this.seatRepository.update(seat);
      }
    });
  },
  { ttl: 30000, globalTimeoutMs: 6000 }
);
```

---

## Desafios Técnicos (Explicar em 5 minutos)

### 1. Race Condition ✅

**Problema:** 2 usuários reservam o mesmo assento

**Solução:** Lock distribuído + pessimista

```
Usuário A: Adquire lock → Transação → Libera lock
Usuário B: Espera lock → Tenta validar → Falha (assento já reservado)
```

### 2. Deadlock ✅

**Problema:** Usuário A: [1, 3], Usuário B: [3, 1]

**Solução:** Ordena recursos antes de adquirir

```typescript
const uniqueResources = Array.from(new Set(resources)).sort();
// Ambos: [1, 3] → sem deadlock
```

### 3. Idempotência ✅

**Problema:** Cliente reenvia requisição por timeout

**Solução:** Armazena IDs de eventos processados no Redis

```typescript
// Se evento já foi processado, ignora
if (await this.isEventProcessed(eventId)) {
  return { processed: false };
}
```

### 4. Expiração de Reserva ✅

**Problema:** Reservas não confirmadas devem liberar assentos após 30s

**Solução:** Worker com Cron que executa a cada 5s

```typescript
@Cron(CronExpression.EVERY_5_SECONDS)
async checkExpiredReservations() {
  const expired = await this.reservationRepository
    .findExpiredReservations();
  // UPDATE reservations SET status = 'expired'
  // UPDATE seats SET status = 'available'
}
```

---

## Kafka e Eventos (Explicar em 3 minutos)

### Fluxo

```
Controller publica evento
    ↓
Kafka enfileira
    ↓
Consumer subscreve
    ↓
Processa idempotentemente
    ↓
Envia notificações
```

### Código

```typescript
// Publicar
await this.producer.send({
  topic: 'cinema.reservations',
  messages: [{
    key: reservationId,
    value: JSON.stringify({
      eventId: uuid(),
      eventType: 'ReservationCreated',
      data: { ... }
    })
  }]
});

// Consumir
await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value);
    
    // Processa idempotentemente
    await this.idempotencyService.processEventIdempotently(
      event.eventId,
      async () => {
        // Lógica aqui
      }
    );
  }
});
```

### Dead Letter Queue

```typescript
// Se falha 3 vezes, vai para DLQ
if (retryCount >= 3) {
  await this.producer.send({
    topic: 'cinema.dead-letter',
    messages: [{
      key: message.key,
      value: message.value,
      headers: {
        'x-original-topic': topic,
        'x-retry-count': retryCount,
        'x-error': error.message
      }
    }]
  });
}
```

---

## Testes (Explicar em 2 minutos)

### Cobertura

- **66 testes unitários** (~70% cobertura)
- **16 testes e2e** (fluxos completos)

### Executar

```bash
npm run test              # Unitários
npm run test:e2e          # E2E
npm run test:cov          # Cobertura
```

### Exemplo de Teste

```typescript
describe('CreateReservationUseCase', () => {
  it('should create a reservation with locks', async () => {
    // Arrange
    const input = {
      sessionId: 'sess-123',
      userId: 'user-456',
      seatNumbers: [5, 6]
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(result.status).toBe('pending');
    expect(result.expiresAt).toBeGreaterThan(new Date());
  });
});
```

---

## Padrões de Design (Explicar em 3 minutos)

### 1. Repository Pattern

```typescript
// Interface (Domain)
interface ISessionRepository {
  create(session: Session): Promise<void>;
  findById(id: string): Promise<Session | null>;
}

// Implementação (Infrastructure)
class SessionRepositoryImpl implements ISessionRepository {
  async create(session: Session): Promise<void> {
    // Lógica de banco aqui
  }
}
```

**Benefício:** Trocar implementação sem afetar lógica de negócio

### 2. Use Case Pattern

```typescript
@Injectable()
export class CreateReservationUseCase {
  async execute(input: CreateReservationRequestDTO): Promise<ReservationResponseDTO> {
    // Lógica isolada e reutilizável
  }
}
```

**Benefício:** Lógica de negócio independente de HTTP

### 3. Dependency Injection

```typescript
constructor(
  private readonly sessionRepository: ISessionRepository,
  private readonly distributedLockService: DistributedLockService,
  private readonly eventPublisher: EventsPublisherService
) {}
```

**Benefício:** Fácil de testar, trocar implementações

### 4. Value Objects

```typescript
export class Price {
  constructor(private readonly value: number) {
    if (value < 0) throw new Error('Price cannot be negative');
  }

  multiply(quantity: number): Price {
    return new Price(this.value * quantity);
  }
}
```

**Benefício:** Validação e lógica encapsuladas

---

## Respostas para Perguntas Comuns

### "Como você garante que 2 usuários não compram o mesmo assento?"

Resposta: Uso 3 camadas de proteção:
1. **Lock distribuído no Redis** - Apenas um usuário consegue adquirir
2. **Lock pessimista no PostgreSQL** - `SELECT ... FOR UPDATE` bloqueia as linhas
3. **Validação dupla** - Verifica antes e depois do lock

Resultado: Impossível ter race condition.

### "E se o Redis cair?"

Resposta: O PostgreSQL ainda protege com `FOR UPDATE`. Pode ser mais lento, mas seguro.

### "Como você garante que eventos Kafka não são processados 2 vezes?"

Resposta: `IdempotencyService` armazena IDs de eventos processados no Redis por 24h. Se evento chegar novamente, ignora.

### "Como você libera assentos após 30 segundos?"

Resposta: Worker com Cron que executa a cada 5 segundos. Busca reservas onde `expiresAt < NOW()` e marca como expiradas.

### "Qual é a diferença entre lock distribuído e pessimista?"

Resposta:
- **Distribuído (Redis):** Coordena entre múltiplas instâncias da aplicação
- **Pessimista (PostgreSQL):** Bloqueia linhas no banco de dados

Ambos são necessários para garantir consistência.

---

## Demonstração Prática (Se Pedirem)

### Criar Sessão

```bash
curl -X POST http://localhost:3000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "movieTitle": "Avatar",
    "showTime": "2027-02-15T20:00:00Z",
    "totalSeats": 100,
    "priceInCents": 2500
  }'
```

### Registrar Usuário

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@cinema.com",
    "password": "Test123!",
    "firstName": "João",
    "lastName": "Silva"
  }'
```

### Fazer Reserva

```bash
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess-123",
    "userId": "user-456",
    "seatNumbers": [5, 6]
  }'
```

### Confirmar Pagamento

```bash
curl -X POST http://localhost:3000/api/v1/payments/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "res-789",
    "paidAmountInCents": 5000
  }'
```

---

## Pontos Fortes para Destacar

✅ **Controle de Concorrência Robusto** - 3 camadas de proteção
✅ **Arquitetura Limpa** - Separação clara de responsabilidades
✅ **Processamento Assíncrono** - Kafka com idempotência e DLQ
✅ **Testes Completos** - 82 testes (66 unitários + 16 e2e)
✅ **Logging Estruturado** - Winston com múltiplos níveis
✅ **Padrões de Design** - Repository, Use Case, DI, Value Objects
✅ **Documentação** - README, exemplos práticos, guias detalhados

---

## Estrutura de Pastas (Se Pedirem)

```
src/
├── application/          # Use Cases e DTOs
├── domain/              # Entidades e regras de negócio
├── infrastructure/      # Repositórios, Kafka, Redis, PostgreSQL
├── presentation/        # Controllers HTTP
└── shared/              # Decorators, filtros, utilitários
```

---

## Última Dica

Quando explicar, use **exemplos concretos** e **diagramas visuais**. Não fique muito técnico. Mostre que você entende o **problema de negócio** (vender ingressos sem duplicação) e como a **arquitetura resolve**.

Boa sorte na entrevista! 🚀
