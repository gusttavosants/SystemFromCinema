import {
  Admin,
  Consumer,
  Kafka,
  logLevel,
  Producer,
  type SASLOptions,
} from 'kafkajs';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { kafkaTopicsConfig } from './kafka-topics.config';

@Injectable()
export class KafkaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaClient.name);
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  private readonly consumers: Consumer[] = [];

  async onModuleInit() {
    this.logger.log('Initializing Kafka client...');

    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'cinema-service',
      brokers: this.getBrokerList(),
      connectionTimeout: 10000,
      requestTimeout: 25000,
      logLevel: logLevel.ERROR,
      ssl: this.shouldUseSsl() ? {} : undefined,
      sasl: this.getSaslConfig(),
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

    this.admin = this.kafka.admin();

    try {
      await this.admin.connect();
      await this.ensureTopics();
      await this.admin.disconnect();
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
    await Promise.all(
      this.consumers.map(async (consumer) => {
        try {
          await consumer.disconnect();
        } catch (error) {
          this.logger.error(
            `Error disconnecting consumer: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }),
    );
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

  createConsumer(groupId: string): Consumer {
    if (!this.kafka) {
      throw new Error('Kafka client not initialized');
    }

    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: this.getEnvNumber(
        'KAFKA_CONSUMER_SESSION_TIMEOUT',
        30000,
      ),
      retry: {
        initialRetryTime: 100,
        retries: 8,
        multiplier: 2,
        maxRetryTime: 30000,
      },
    });

    this.consumers.push(consumer);
    return consumer;
  }

  private async ensureTopics(): Promise<void> {
    if (!this.admin || kafkaTopicsConfig.length === 0) {
      return;
    }

    try {
      const created = await this.admin.createTopics({
        waitForLeaders: true,
        topics: kafkaTopicsConfig,
      });

      if (created) {
        this.logger.log('Kafka topics verified/created successfully');
      }
    } catch (error) {
      this.logger.error(
        `Error ensuring Kafka topics: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  private getBrokerList(): string[] {
    const brokers = process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER;
    const brokerList = (brokers || 'localhost:9092')
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean);

    if (brokerList.length === 0) {
      throw new Error('No Kafka brokers configured');
    }

    return brokerList;
  }

  private shouldUseSsl(): boolean {
    return (process.env.KAFKA_SECURITY_PROTOCOL || '').toLowerCase() === 'ssl';
  }

  private getSaslConfig(): SASLOptions | undefined {
    const username = process.env.KAFKA_SASL_USERNAME;
    const password = process.env.KAFKA_SASL_PASSWORD;

    if (!username || !password) {
      return undefined;
    }

    const mechanism = (process.env.KAFKA_SASL_MECHANISM || 'plain')
      .toLowerCase()
      .trim();

    if (mechanism === 'scram-sha-256') {
      return {
        mechanism: 'scram-sha-256',
        username,
        password,
      } satisfies SASLOptions;
    }

    if (mechanism === 'scram-sha-512') {
      return {
        mechanism: 'scram-sha-512',
        username,
        password,
      } satisfies SASLOptions;
    }

    return {
      mechanism: 'plain',
      username,
      password,
    } satisfies SASLOptions;
  }

  private getEnvNumber(key: string, fallback: number): number {
    const value = process.env[key];
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return fallback;
    }
    return parsed;
  }
}
