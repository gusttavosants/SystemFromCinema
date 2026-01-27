import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@infrastructure/cache';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly TTL_SECONDS = 24 * 60 * 60; // 24 horas

  constructor(private readonly redisService: RedisService) {}

  /**
   * Verifica se um evento já foi processado
   * @param eventId ID único do evento
   * @returns true se já foi processado, false caso contrário
   */
  async isEventProcessed(eventId: string): Promise<boolean> {
    try {
      const key = this.getEventKey(eventId);
      const result = await this.redisService.getClient().exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Error checking if event ${eventId} was processed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      // Em caso de erro, assume que não foi processado para evitar perda de eventos
      return false;
    }
  }

  /**
   * Marca um evento como processado
   * @param eventId ID único do evento
   */
  async markEventAsProcessed(eventId: string): Promise<void> {
    try {
      const key = this.getEventKey(eventId);
      await this.redisService
        .getClient()
        .setex(key, this.TTL_SECONDS, 'processed');
      this.logger.debug(`Marked event ${eventId} as processed`);
    } catch (error) {
      this.logger.error(
        `Error marking event ${eventId} as processed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Processa um evento de forma idempotente
   * @param eventId ID único do evento
   * @param processor Função que processa o evento
   * @returns true se o evento foi processado, false se já havia sido processado
   */
  async processEventIdempotently<T>(
    eventId: string,
    processor: () => Promise<T>,
  ): Promise<{ processed: boolean; result?: T }> {
    try {
      // Verificar se já foi processado
      const alreadyProcessed = await this.isEventProcessed(eventId);
      if (alreadyProcessed) {
        this.logger.debug(`Event ${eventId} already processed, skipping`);
        return { processed: false };
      }

      // Processar o evento
      const result = await processor();

      // Marcar como processado
      await this.markEventAsProcessed(eventId);

      this.logger.debug(`Successfully processed event ${eventId}`);
      return { processed: true, result };
    } catch (error) {
      this.logger.error(
        `Error processing event ${eventId} idempotently: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private getEventKey(eventId: string): string {
    return `processed_event:${eventId}`;
  }
}
