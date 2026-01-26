import type { ITopicConfig } from 'kafkajs';

export const kafkaTopicsConfig: ITopicConfig[] = [
  {
    topic: 'cinema.reservations',
    numPartitions: 3,
    replicationFactor: 1,
  },
  {
    topic: 'cinema.payments',
    numPartitions: 3,
    replicationFactor: 1,
  },
  {
    topic: 'cinema.notifications',
    numPartitions: 2,
    replicationFactor: 1,
  },
];

export const kafkaConsumerGroups = {
  reservationProcessors: 'reservation-processors',
  paymentProcessors: 'payment-processors',
  notificationSenders: 'notification-senders',
} as const;
