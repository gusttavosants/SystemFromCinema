# 🎬 Cinema Booking API

Sistema de venda de ingressos para uma rede de cinemas, desenvolvido com NestJS, focado em alta concorrência e sistemas distribuídos.

## 📋 Visão Geral

Este projeto implementa um sistema completo de reserva e venda de ingressos de cinema, com as seguintes características principais:

- **Controle de concorrência** com locks distribuídos (Redis)
- **Reservas temporárias** com expiração automática (30 segundos)
- **Processamento assíncrono** via mensageria (Kafka)
- **Prevenção de venda duplicada** de assentos
- **Arquitetura limpa** seguindo princípios SOLID e DDD

## 🛠️ Tecnologias Escolhidas

| Tecnologia     | Versão | Justificativa                                                      |
| -------------- | ------ | ------------------------------------------------------------------ |
| **Node.js**    | 22.x   | Runtime JavaScript de alta performance                             |
| **NestJS**     | 11.x   | Framework robusto com suporte a DI, módulos e decorators           |
| **PostgreSQL** | 15     | Banco relacional com suporte a transações ACID e locks pessimistas |
| **Redis**      | 7      | Cache distribuído e implementação de locks distribuídos (Redlock)  |
| **Kafka**      | 7.5    | Sistema de mensageria distribuído para eventos assíncronos         |
| **TypeORM**    | 0.3.x  | ORM com suporte a migrations e transações                          |
| **Docker**     | -      | Containerização para ambiente consistente                          |

### Por que essas escolhas?

- **PostgreSQL**: Escolhido por suportar transações ACID e locks pessimistas (`FOR UPDATE`), essenciais para garantir consistência em operações concorrentes de reserva de assentos.

- **Redis**: Utilizado para implementar locks distribuídos usando o algoritmo Redlock, permitindo coordenação entre múltiplas instâncias da aplicação.

- **Kafka**: Sistema de mensageria robusto que garante entrega de mensagens e permite processamento assíncrono de eventos como confirmação de pagamento e expiração de reservas.

## 🚀 Como Executar

### Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 22+ (opcional, para desenvolvimento local)
- Git

### Subindo o ambiente

```bash
# Clone o repositório
git clone <repository-url>
cd project-name

# Inicie todos os serviços com um único comando
docker-compose up -d

# Aguarde os serviços ficarem saudáveis (cerca de 60 segundos)
docker-compose ps
```

A aplicação estará disponível em:

- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api-docs

### Populando dados iniciais

```bash
# Criar uma sessão de cinema
curl -X POST http://localhost:3000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "movieTitle": "Avatar: The Way of Water",
    "room": "Sala 1",
    "showTime": "2027-02-15T20:00:00Z",
    "totalSeats": 100,
    "priceInCents": 2500
  }'

# Registrar um usuário
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@cinema.com",
    "password": "Senha123!",
    "firstName": "João",
    "lastName": "Silva"
  }'
```

### Executando testes

```bash
# Testes unitários (66 testes)
npm run test

# Testes e2e (16 testes)
npm run test:e2e -- --forceExit

# Cobertura de testes
npm run test:cov
```

## 📡 Endpoints da API

### Autenticação

| Método | Endpoint                | Descrição                 |
| ------ | ----------------------- | ------------------------- |
| POST   | `/api/v1/auth/register` | Registrar novo usuário    |
| POST   | `/api/v1/auth/login`    | Login e obtenção de token |

### Sessões

| Método | Endpoint                               | Descrição                     |
| ------ | -------------------------------------- | ----------------------------- |
| GET    | `/api/v1/sessions`                     | Listar todas as sessões       |
| POST   | `/api/v1/sessions`                     | Criar nova sessão             |
| GET    | `/api/v1/sessions/:id/availability`    | Disponibilidade em tempo real |
| GET    | `/api/v1/sessions/:id/available-seats` | Assentos disponíveis          |

### Reservas

| Método | Endpoint                                 | Descrição                       |
| ------ | ---------------------------------------- | ------------------------------- |
| POST   | `/api/v1/reservations`                   | Criar reserva (válida por 30s)  |
| GET    | `/api/v1/reservations/session/:id/seats` | Assentos disponíveis por sessão |

### Pagamentos

| Método | Endpoint                   | Descrição           |
| ------ | -------------------------- | ------------------- |
| POST   | `/api/v1/payments/confirm` | Confirmar pagamento |

### Usuários

| Método | Endpoint                      | Descrição            |
| ------ | ----------------------------- | -------------------- |
| GET    | `/api/v1/users/:id/purchases` | Histórico de compras |

## 🔒 Estratégias de Concorrência

### 1. Race Conditions

**Problema**: 2 usuários clicam no último assento disponível no mesmo milissegundo.

**Solução implementada**:

- **Lock distribuído (Redis)**: Antes de reservar, o sistema adquire um lock para cada assento usando o algoritmo Redlock
- **Lock pessimista (PostgreSQL)**: Dentro da transação, usa `SELECT ... FOR UPDATE` para garantir exclusividade
- **Validação dupla**: Verifica disponibilidade antes e depois de adquirir o lock

```typescript
// Exemplo do fluxo de reserva
await this.distributedLockService.executeWithLocks(
  seatLockResources, // ['seat:session1:1', 'seat:session1:2']
  async () => {
    await this.unitOfWork.transactionPessimistic(async () => {
      const seats = await this.seatRepository.findWithPessimisticLock(
        sessionId,
        seatNumbers,
      );
      // Validar e reservar...
    });
  },
);
```

### 2. Deadlocks

**Problema**: Usuário A reserva assentos 1 e 3, Usuário B reserva assentos 3 e 1.

**Solução implementada**:

- **Ordenação de recursos**: Locks são sempre adquiridos em ordem crescente de número do assento
- **Timeout global**: Se não conseguir todos os locks em 6 segundos, libera os já adquiridos e falha

```typescript
// Recursos são ordenados antes de adquirir locks
const uniqueResources = Array.from(new Set(resources)).sort();
```

### 3. Idempotência

**Problema**: Cliente reenvia mesma requisição por timeout.

**Solução implementada**:

- **IdempotencyService**: Armazena IDs de eventos processados no Redis por 24h
- **Verificação antes de processar**: Se evento já foi processado, ignora silenciosamente

```typescript
async processEventIdempotently(eventId: string, processor: () => Promise<T>) {
  if (await this.isEventProcessed(eventId)) {
    return { processed: false };
  }
  const result = await processor();
  await this.markEventAsProcessed(eventId);
  return { processed: true, result };
}
```

### 4. Expiração de Reservas

**Problema**: Reservas não confirmadas devem liberar o assento após 30 segundos.

**Solução implementada**:

- **Worker com Cron**: Executa a cada 5 segundos verificando reservas expiradas
- **Liberação automática**: Marca reserva como expirada e assentos como disponíveis
- **Evento publicado**: Notifica via Kafka sobre a expiração

```typescript
@Cron(CronExpression.EVERY_5_SECONDS)
async checkExpiredReservations() {
  const expired = await this.reservationRepository.findExpiredReservations();
  await this.cancelExpiredReservationsUseCase.execute();
  // Publica eventos de expiração...
}
```

## 📊 Fluxo de Reserva

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────▶│  API REST   │────▶│  Use Case   │────▶│   Redis     │
│             │     │             │     │             │     │  (Lock)     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Kafka     │◀────│ PostgreSQL  │
                    │  (Evento)   │     │ (Transação) │
                    └─────────────┘     └─────────────┘
```

1. Cliente solicita reserva via API
2. Sistema adquire lock distribuído no Redis
3. Dentro de transação pessimista, verifica e reserva assentos
4. Publica evento `ReservationCreated` no Kafka
5. Retorna ID da reserva e timestamp de expiração

## ✅ Diferenciais Implementados

| Diferencial         | Status | Descrição                                         |
| ------------------- | ------ | ------------------------------------------------- |
| Swagger/OpenAPI     | ✅     | Documentação em `/api-docs`                       |
| Testes Unitários    | ✅     | 66 testes, ~70% cobertura                         |
| Testes E2E          | ✅     | 16 testes de integração                           |
| Dead Letter Queue   | ✅     | Mensagens com falha vão para `cinema.dead-letter` |
| Retry com Backoff   | ✅     | Exponential backoff em locks e mensageria         |
| Idempotência        | ✅     | Processamento idempotente de eventos              |
| Logging Estruturado | ✅     | Winston com níveis DEBUG, INFO, WARN, ERROR       |

## 🏗️ Arquitetura

```
src/
├── application/          # Casos de uso e DTOs
│   ├── dtos/            # Data Transfer Objects
│   └── use-cases/       # Lógica de negócio
├── domain/              # Entidades e regras de domínio
│   ├── booking/         # Reservas
│   ├── cinema/          # Sessões e assentos
│   └── user/            # Usuários
├── infrastructure/      # Implementações externas
│   ├── cache/           # Redis e locks distribuídos
│   ├── database/        # TypeORM, repositórios, migrations
│   ├── events/          # Publicação de eventos
│   ├── logging/         # Logger estruturado
│   └── messaging/       # Kafka producers e consumers
├── presentation/        # Controllers e filtros HTTP
└── shared/              # Utilitários compartilhados
```

## ⚠️ Limitações Conhecidas

1. **Autenticação simplificada**: JWT implementado mas não aplicado em todos os endpoints
2. **Rate Limiting**: Não implementado (seria um diferencial adicional)
3. **Testes de carga**: Não foram realizados testes de stress com múltiplos usuários simultâneos
4. **Monitoramento**: Não há integração com ferramentas como Prometheus/Grafana

## 🔮 Melhorias Futuras

1. **Rate Limiting**: Implementar limitação de requisições por IP/usuário usando Redis
2. **Circuit Breaker**: Adicionar padrão circuit breaker para chamadas externas
3. **Métricas**: Integrar com Prometheus para métricas de performance
4. **Testes de Carga**: Usar k6 ou Artillery para simular cenários de alta concorrência
5. **CQRS**: Separar modelos de leitura e escrita para melhor escalabilidade
6. **Cache de Sessões**: Implementar cache de disponibilidade para reduzir queries

## 📝 Exemplo de Fluxo para Testar

```bash
# 1. Criar sessão com 16+ assentos
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"movieTitle":"Filme X","room":"Sala 1","showTime":"2027-03-15T19:00:00Z","totalSeats":50,"priceInCents":2500}')
SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.data.id')
echo "Session ID: $SESSION_ID"

# 2. Registrar usuário
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@cinema.com","password":"Test123!","firstName":"Test","lastName":"User"}')
USER_ID=$(echo $USER_RESPONSE | jq -r '.data.id')
echo "User ID: $USER_ID"

# 3. Verificar disponibilidade
curl -s http://localhost:3000/api/v1/sessions/$SESSION_ID/availability | jq '.data.availableSeats | length'

# 4. Criar reserva
RESERVATION=$(curl -s -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"userId\":\"$USER_ID\",\"seatNumbers\":[1,2]}")
RESERVATION_ID=$(echo $RESERVATION | jq -r '.data.id')
echo "Reservation ID: $RESERVATION_ID"

# 5. Confirmar pagamento
curl -s -X POST http://localhost:3000/api/v1/payments/confirm \
  -H "Content-Type: application/json" \
  -d "{\"reservationId\":\"$RESERVATION_ID\",\"paidAmountInCents\":5000}"

# 6. Verificar histórico de compras
curl -s http://localhost:3000/api/v1/users/$USER_ID/purchases | jq
```

## 📄 Licença

Este projeto é [MIT licensed](LICENSE).
