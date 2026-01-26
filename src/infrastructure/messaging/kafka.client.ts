import { Kafka, logLevel, Producer } from 'kafkajs';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

@Injectable()
export class KafkaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaClient.name);
  private kafka: Kafka;
  private producer: Producer;

  async onModuleInit() {
    this.logger.log('Initializing Kafka client...');

    this.kafka = new Kafka({
      clientId: 'cinema-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      connectionTimeout: 10000,
      requestTimeout: 25000,
      logLevel: logLevel.ERROR,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        multiplier: 2,
        maxRetryTime: 30000,
      },
    });

    this.producer = this.kafka.producer({
      idempotent: true,
      transactionTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        multiplier: 2,
        maxRetryTime: 30000,
      },
    });

    try {
      await this.producer.connect();
      this.logger.log('Kafka client connected successfully');
    } catch (error) {
      this.logger.error(
        `Failed to connect to Kafka: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Kafka client...');
    if (this.producer) {
      await this.producer.disconnect();
      this.logger.log('Kafka client disconnected');
    }
  }

  getProducer(): Producer {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }
    return this.producer;
  }
}
