import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter } from 'events';

interface InMemoryMessage {
  key: string;
  value: string;
  headers?: Record<string, Buffer>;
  timestamp?: string;
}

interface InMemoryConsumer {
  groupId: string;
  topics: string[];
  handler: (message: InMemoryMessage) => Promise<void>;
  running: boolean;
}

@Injectable()
export class KafkaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaClient.name);
  private eventEmitter: EventEmitter;
  private readonly consumers: InMemoryConsumer[] = [];
  private readonly messageQueues: Map<string, InMemoryMessage[]> = new Map();

  async onModuleInit() {
    this.logger.log('Initializing In-Memory Event Bus (Kafka replacement)...');
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(100);
    this.logger.log('In-Memory Event Bus initialized successfully');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting In-Memory Event Bus...');
    this.consumers.forEach((consumer) => {
      consumer.running = false;
    });
    this.eventEmitter.removeAllListeners();
    this.messageQueues.clear();
    this.logger.log('In-Memory Event Bus disconnected');
  }

  getProducer(): any {
    return {
      send: async ({
        topic,
        messages,
      }: {
        topic: string;
        messages: InMemoryMessage[];
      }) => {
        for (const message of messages) {
          const messageWithTimestamp = {
            ...message,
            timestamp: new Date().toISOString(),
          };

          if (!this.messageQueues.has(topic)) {
            this.messageQueues.set(topic, []);
          }
          this.messageQueues.get(topic)!.push(messageWithTimestamp);

          this.eventEmitter.emit(topic, messageWithTimestamp);

          this.logger.debug(`Message published to topic ${topic}`);
        }
      },
    };
  }

  createConsumer(groupId: string): any {
    const consumer: InMemoryConsumer = {
      groupId,
      topics: [],
      handler: async () => {},
      running: false,
    };

    this.consumers.push(consumer);

    return {
      connect: async () => {
        this.logger.log(`Consumer ${groupId} connected`);
      },
      disconnect: async () => {
        consumer.running = false;
        this.logger.log(`Consumer ${groupId} disconnected`);
      },
      subscribe: async ({ topics }: { topics: string[] }) => {
        consumer.topics = topics;
        this.logger.log(
          `Consumer ${groupId} subscribed to topics: ${topics.join(', ')}`,
        );
      },
      run: async ({
        eachMessage,
      }: {
        eachMessage: (payload: any) => Promise<void>;
      }) => {
        consumer.running = true;

        for (const topic of consumer.topics) {
          this.eventEmitter.on(topic, async (message: InMemoryMessage) => {
            if (!consumer.running) return;

            try {
              await eachMessage({
                topic,
                partition: 0,
                message: {
                  key: message.key ? Buffer.from(message.key) : null,
                  value: Buffer.from(message.value),
                  headers: message.headers || {},
                  timestamp: message.timestamp || new Date().toISOString(),
                  offset: '0',
                },
              });
            } catch (error) {
              this.logger.error(
                `Error processing message in consumer ${groupId}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
            }
          });
        }

        this.logger.log(`Consumer ${groupId} is running`);
      },
    };
  }
}
