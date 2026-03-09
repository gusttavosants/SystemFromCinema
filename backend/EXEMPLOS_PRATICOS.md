# 📖 Exemplos Práticos - Cinema Booking API

## Índice
1. [Exemplo 1: Fluxo Completo de Reserva](#exemplo-1-fluxo-completo-de-reserva)
2. [Exemplo 2: Tratamento de Race Condition](#exemplo-2-tratamento-de-race-condition)
3. [Exemplo 3: Expiração de Reserva](#exemplo-3-expiração-de-reserva)
4. [Exemplo 4: Processamento de Eventos Kafka](#exemplo-4-processamento-de-eventos-kafka)
5. [Diagramas Visuais](#diagramas-visuais)

---

## Exemplo 1: Fluxo Completo de Reserva

### Passo a Passo com Código Real

#### 1. Cliente faz requisição HTTP

```bash
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess-123",
    "userId": "user-456",
    "seatNumbers": [5, 6]
  }'
```

#### 2. Controller recebe requisição

```typescript
// src/presentation/controllers/reservations.controller.ts

@Post()
@UseGuards(JwtAuthGuard)  // Valida JWT token
@Version('1')
async create(
  @Body() createReservationDto: CreateReservationRequestDTO,
): Promise<ReservationResponseDTO> {
  // Chama use case
  const reservation = await this.createReservationUseCase.execute(
    createReservationDto
  );

  // Publica evento Kafka
  await this.eventPublisher.publishEvent('ReservationCreated', {
    reservationId: reservation.id,
    sessionId: reservation.sessionId,
    userId: reservation.userId,
    seatNumber: reservation.seatNumbers[0] || 0,
    quantity: reservation.seatNumbers.length,
    totalPrice: reservation.totalPriceInCents,
    timestamp: new Date(),
  });

  return reservation;
}
```

#### 3. Use Case executa lógica de negócio

```typescript
// src/application/use-cases/booking/create-reservation.use-case.ts

async execute(
  input: CreateReservationRequestDTO,
): Promise<ReservationResponseDTO> {
  // Passo 1: Valida sessão
  const session = await this.sessionRepository.findById(input.sessionId);
  if (!session) {
    throw new SessionNotFoundException(input.sessionId);
  }

  let reservation: Reservation;

  try {
    // Passo 2: Adquire locks distribuídos
    // Cria chaves: ['seat:sess-123:5', 'seat:sess-123:6']
    await this.distributedLockService.executeWithLocks(
      this.buildSeatLockResources(input.sessionId, input.seatNumbers),
      async () => {
        // Passo 3: Executa transação pessimista
        await this.unitOfWork.transactionPessimistic(async () => {
          // Passo 4: Busca assentos COM LOCK
          // SELECT * FROM seats WHERE ... FOR UPDATE
          const seatsWithLock =
            await this.seatRepository.findWithPessimisticLock(
              input.sessionId,
              input.seatNumbers,
            );

          // Passo 5: Valida disponibilidade
          const unavailableSeats = seatsWithLock.filter(
            (s) => s.status !== 'available',
          );
          if (unavailableSeats.length > 0) {
            throw new SeatNotAvailableException(
              input.sessionId,
              unavailableSeats.map((s) => s.seatNumber.getValue()),
            );
          }

          // Passo 6: Calcula preço
          const totalPrice = session
            .getPrice()
            .multiply(input.seatNumbers.length);
          // Se preço = 2500 cents, total = 2500 * 2 = 5000 cents

          // Passo 7: Cria entidade de reserva
          reservation = Reservation.create({
            sessionId: input.sessionId,
            userId: input.userId,
            seatNumbers: input.seatNumbers,
            totalPrice,
            // Expiração automática em 30 segundos
          });

          // Passo 8: Salva no banco
          await this.reservationRepository.create(reservation);

          // Passo 9: Atualiza assentos
          for (const seat of seatsWithLock) {
            seat.updateStatus('reserved');
            await this.seatRepository.update(seat);
          }
        });
      },
      {
        ttl: 30000,              // Lock expira em 30s
        globalTimeoutMs: 6000,   // Timeout global de 6s
      },
    );
  } catch (error) {
    throw new LockAcquisitionFailedException('reservation');
  }

  // Passo 10: Publica evento
  await this.eventsPublisher.publishReservationCreated({
    reservationId: reservation.getId(),
    sessionId: reservation.getSessionId(),
    userId: reservation.getUserId(),
    seatNumbers: reservation.getSeatNumbers(),
    totalPriceInCents: reservation.getTotalPrice().getValue(),
    expiresAt: reservation.getExpiresAt(),
    createdAt: reservation.getCreatedAt(),
  });

  // Passo 11: Envia email
  try {
    const user = await this.userRepository.findById(input.userId);
    if (user) {
      await this.emailNotificationService.sendReservationConfirmation(
        user.getEmail(),
        {
          customerName: `${user.getFirstName()} ${user.getLastName()}`,
          movieTitle: session.getMovieTitle(),
          showTime: session.getShowTime().toISOString(),
          seatNumbers: reservation.getSeatNumbers(),
          totalPrice: reservation.getTotalPrice().getValue(),
          reservationId: reservation.getId(),
        },
      );
    }
  } catch (error) {
    console.error('Failed to send reservation confirmation email:', error);
  }

  return this.mapToResponse(reservation);
}
```

#### 4. Resposta ao cliente

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Operation successful",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "sess-123",
    "userId": "user-456",
    "seatNumbers": [5, 6],
    "totalPriceInCents": 5000,
    "status": "pending",
    "expiresAt": "2026-01-28T23:45:05.882Z",
    "createdAt": "2026-01-28T23:44:05.882Z"
  },
  "timestamp": "2026-01-28T23:44:05.882Z"
}
```

---

## Exemplo 2: Tratamento de Race Condition

### Cenário: 2 usuários tentam reservar o mesmo assento

```
Tempo    Usuário A                          Usuário B
────────────────────────────────────────────────────────
T0       POST /reservations (assento 5)    
T1                                         POST /reservations (assento 5)
T2       Adquire lock: seat:sess-123:5
T3                                         Tenta adquirir lock (BLOQUEADO)
T4       SELECT * FROM seats FOR UPDATE
T5       Valida: assento 5 = available
T6       INSERT INTO reservations
T7       UPDATE seats SET status='reserved'
T8       COMMIT (libera lock)
T9                                         Adquire lock (agora disponível)
T10                                        SELECT * FROM seats FOR UPDATE
T11                                        Valida: assento 5 = reserved ❌
T12                                        Lança SeatNotAvailableException
T13                                        Retorna erro 409 Conflict
```

### Código que implementa isso

```typescript
// Usuário A
const lockToken = await this.distributedLockService.acquireLock(
  'seat:sess-123:5',
  { ttl: 30000 }
);
// Retorna: 'token-uuid-a'

// Usuário B (ao mesmo tempo)
const lockToken = await this.distributedLockService.acquireLock(
  'seat:sess-123:5',
  { ttl: 30000 }
);
// Retorna: null (bloqueado, faz retry)

// No Redis:
// SET lock:seat:sess-123:5 token-uuid-a PX 30000 NX
// Resultado: OK (para Usuário A)
// Resultado: nil (para Usuário B)
```

---

## Exemplo 3: Expiração de Reserva

### Timeline de 30 segundos

```
T0:00    Usuário faz reserva
         - Status: pending
         - Assentos: reserved
         - Expira em: 30s

T0:05    ReservationExpirationWorker executa (CRON a cada 5s)
         - Procura reservas expiradas
         - Nenhuma encontrada

T0:10    ReservationExpirationWorker executa
         - Procura reservas expiradas
         - Nenhuma encontrada

T0:15    ReservationExpirationWorker executa
         - Procura reservas expiradas
         - Nenhuma encontrada

T0:20    ReservationExpirationWorker executa
         - Procura reservas expiradas
         - Nenhuma encontrada

T0:25    ReservationExpirationWorker executa
         - Procura reservas expiradas
         - Nenhuma encontrada

T0:30    ReservationExpirationWorker executa
         - Procura: SELECT * FROM reservations WHERE expiresAt < NOW()
         - Encontra a reserva!
         - Executa CancelExpiredReservationsUseCase
         - Status: expired
         - Assentos: available
         - Publica evento ReservationExpired no Kafka

T0:35    ReservationExpirationWorker executa
         - Procura reservas expiradas
         - Nenhuma encontrada
```

### Código

```typescript
// src/infrastructure/events/services/reservation-expiration.worker.ts

@Cron(CronExpression.EVERY_5_SECONDS)
async checkExpiredReservations(): Promise<void> {
  try {
    // Busca reservas onde expiresAt < agora
    const expiredReservations =
      await this.reservationRepository.findExpiredReservations();
    // SELECT * FROM reservations 
    // WHERE status = 'pending' AND expiresAt < NOW()

    if (expiredReservations.length === 0) {
      return;
    }

    // Cancela as reservas
    const result = await this.cancelExpiredReservationsUseCase.execute();
    // UPDATE reservations SET status = 'expired'
    // UPDATE seats SET status = 'available'

    // Publica eventos
    for (const reservation of expiredReservations) {
      await this.eventsPublisher.publishReservationExpired({
        reservationId: reservation.getId(),
        sessionId: reservation.getSessionId(),
        seatNumbers: reservation.getSeatNumbers(),
        expiredAt: new Date(),
      });
    }
  } catch (error) {
    this.logger.error(`Error checking expired reservations: ${error.message}`);
  }
}
```

---

## Exemplo 4: Processamento de Eventos Kafka

### Fluxo de Publicação e Consumo

```
1. Controller publica evento
   ↓
2. Kafka recebe mensagem
   ↓
3. Consumer subscreve ao tópico
   ↓
4. Processa idempotentemente
   ↓
5. Envia notificações
```

### Código de Publicação

```typescript
// src/infrastructure/events/services/events-publisher.service.ts

async publishReservationCreated(data: {
  reservationId: string;
  sessionId: string;
  userId: string;
  seatNumbers: number[];
  totalPriceInCents: number;
  expiresAt: Date;
  createdAt: Date;
}): Promise<void> {
  const eventId = uuidv4();  // ID único para idempotência

  await this.kafkaClient.getProducer().send({
    topic: 'cinema.reservations',
    messages: [
      {
        key: data.reservationId,  // Particiona por reservationId
        value: JSON.stringify({
          eventId,
          eventType: 'ReservationCreated',
          data,
          timestamp: new Date(),
        }),
        headers: {
          'event-id': eventId,
          'event-type': 'ReservationCreated',
        },
      },
    ],
  });
}
```

### Código de Consumo

```typescript
// src/infrastructure/messaging/subscribers/reservation-consumer.service.ts

@Injectable()
export class ReservationConsumerService implements OnModuleInit {
  async onModuleInit() {
    const consumer = this.kafkaClient.createConsumer(
      'cinema-reservations-group'
    );

    await consumer.connect();
    await consumer.subscribe({
      topics: ['cinema.reservations'],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          const eventId = message.headers['event-id'].toString();

          // Processa idempotentemente
          await this.idempotencyService.processEventIdempotently(
            eventId,
            async () => {
              if (event.eventType === 'ReservationCreated') {
                await this.handleReservationCreated(event.data);
              }
            }
          );

          // Confirma offset
          await consumer.commitOffsets([
            {
              topic,
              partition,
              offset: (BigInt(message.offset) + 1n).toString(),
            },
          ]);
        } catch (error) {
          this.logger.error(`Failed to process message: ${error.message}`);
          // Não confirma offset, será reprocessado
          throw error;
        }
      },
    });
  }

  private async handleReservationCreated(data: any): Promise<void> {
    this.logger.log(
      `Processing reservation created: ${data.reservationId}`
    );

    // Envia email
    try {
      const user = await this.userRepository.findById(data.userId);
      if (user) {
        await this.emailNotificationService.sendReservationConfirmation(
          user.getEmail(),
          {
            customerName: user.getFirstName(),
            movieTitle: data.movieTitle,
            seatNumbers: data.seatNumbers,
            totalPrice: data.totalPriceInCents,
            reservationId: data.reservationId,
          }
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
    }
  }
}
```

---

## Diagramas Visuais

### 1. Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                     Cliente (Browser)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP Request
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  NestJS Application                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Controllers (Presentation Layer)                    │   │
│  │  - AuthController, SessionsController, etc.         │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Use Cases (Application Layer)                       │   │
│  │  - CreateReservationUseCase, ConfirmPaymentUseCase   │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Repositories (Infrastructure Layer)                 │   │
│  │  - SessionRepository, ReservationRepository, etc.    │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼──────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────┐
        │             │             │              │
        ▼             ▼             ▼              ▼
    PostgreSQL    Redis         Kafka          Email
    (Dados)     (Locks)      (Eventos)      (Notificações)
```

### 2. Fluxo de Reserva com Locks

```
Cliente A                    Redis                PostgreSQL
    │                          │                      │
    ├─ Adquire Lock ──────────►│                      │
    │  (seat:sess:5)           │ SET NX ✓             │
    │                          │                      │
    ├─ Transação ─────────────────────────────────────►│
    │                          │  SELECT ... FOR UPDATE│
    │                          │                      │
    │                          │  Valida: available ✓ │
    │                          │                      │
    │                          │  INSERT reservation  │
    │                          │                      │
    │                          │  UPDATE seat status  │
    │                          │                      │
    │                          │  COMMIT ◄────────────┤
    │                          │                      │
    ├─ Libera Lock ──────────►│                      │
    │  (seat:sess:5)           │ DEL ✓                │
    │                          │                      │
    ◄─ Resposta 201 ──────────┘                      │
```

### 3. Timeline de Expiração

```
Tempo    Ação
────────────────────────────────────────────────────
T0:00    Reserva criada
         Status: pending
         Assentos: reserved
         Expira em: 30s

T0:05    Worker executa (não encontra expiradas)

T0:10    Worker executa (não encontra expiradas)

T0:15    Worker executa (não encontra expiradas)

T0:20    Worker executa (não encontra expiradas)

T0:25    Worker executa (não encontra expiradas)

T0:30    ⚠️  Worker encontra reserva expirada!
         Status: expired
         Assentos: available
         Publica evento Kafka

T0:35    Worker executa (não encontra expiradas)
```

### 4. Processamento de Eventos Kafka

```
Controller                Kafka                Consumer
    │                       │                      │
    ├─ Publica evento ─────►│                      │
    │  ReservationCreated   │                      │
    │                       │                      │
    │                       ├─ Enfileira ─────────►│
    │                       │  mensagem            │
    │                       │                      │
    │                       │                      ├─ Processa
    │                       │                      │  idempotentemente
    │                       │                      │
    │                       │                      ├─ Envia email
    │                       │                      │
    │                       │                      ├─ Confirma offset
    │                       │                      │
    │                       │◄─ Commit offset ────┤
    │                       │                      │
    ◄─ Resposta 201 ───────┘                      │
```

---

## Resumo Executivo para Entrevista

### O que foi implementado

✅ **Arquitetura Limpa** - Separação clara de responsabilidades
✅ **Controle de Concorrência** - Locks distribuídos + pessimistas
✅ **Processamento Assíncrono** - Kafka com idempotência
✅ **Persistência** - PostgreSQL com transações ACID
✅ **Cache Distribuído** - Redis para locks e cache
✅ **Logging Estruturado** - Winston com múltiplos níveis
✅ **Testes Completos** - 66 unitários + 16 e2e

### Desafios Resolvidos

| Desafio | Solução |
|---------|---------|
| Race condition | Lock distribuído + pessimista |
| Deadlock | Ordenação de recursos |
| Idempotência | IdempotencyService com Redis |
| Expiração | Worker com Cron |
| Confiabilidade | Kafka com retry e DLQ |

### Tecnologias Escolhidas

| Tech | Razão |
|------|-------|
| NestJS | Framework robusto com DI |
| PostgreSQL | ACID + locks pessimistas |
| Redis | Redlock para locks distribuídos |
| Kafka | Garantia de entrega |
| TypeORM | Migrations e transações |
| Winston | Logging estruturado |
