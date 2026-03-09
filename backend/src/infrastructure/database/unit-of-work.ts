import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import type {
  IReservationRepository,
  ISaleRepository,
} from '@domain/booking/repositories';
import type {
  ISeatRepository,
  ISessionRepository,
} from '@domain/cinema/repositories';
import { ReservationRepositoryImpl } from './repositories/reservation.repository.impl';
import { SaleRepositoryImpl } from './repositories/sale.repository.impl';
import { SeatRepositoryImpl } from './repositories/seat.repository.impl';
import { SessionRepositoryImpl } from './repositories/session.repository.impl';

@Injectable()
export class UnitOfWork {
  private entityManager: EntityManager;

  private sessionRepository: SessionRepositoryImpl | null = null;

  private seatRepository: SeatRepositoryImpl | null = null;

  private reservationRepository: ReservationRepositoryImpl | null = null;

  private saleRepository: SaleRepositoryImpl | null = null;

  constructor(private readonly dataSource: DataSource) {
    this.entityManager = this.dataSource.manager;
  }

  getSessionRepository(): ISessionRepository {
    if (!this.sessionRepository) {
      this.sessionRepository = new SessionRepositoryImpl(
        this.entityManager.getRepository('sessions'),
      );
    }
    return this.sessionRepository;
  }

  getSeatRepository(): ISeatRepository {
    if (!this.seatRepository) {
      this.seatRepository = new SeatRepositoryImpl(
        this.entityManager.getRepository('seats'),
      );
    }
    return this.seatRepository;
  }

  getReservationRepository(): IReservationRepository {
    if (!this.reservationRepository) {
      this.reservationRepository = new ReservationRepositoryImpl(
        this.entityManager.getRepository('reservations'),
      );
    }
    return this.reservationRepository;
  }

  getSaleRepository(): ISaleRepository {
    if (!this.saleRepository) {
      this.saleRepository = new SaleRepositoryImpl(
        this.entityManager.getRepository('sales'),
      );
    }
    return this.saleRepository;
  }

  async transaction<T>(
    callback: (unitOfWork: UnitOfWork) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const previousManager = this.entityManager;
      this.entityManager = manager;

      // Reset repositories to use new transaction manager
      this.sessionRepository = null;
      this.seatRepository = null;
      this.reservationRepository = null;
      this.saleRepository = null;

      try {
        return await callback(this);
      } finally {
        this.entityManager = previousManager;
        this.sessionRepository = null;
        this.seatRepository = null;
        this.reservationRepository = null;
        this.saleRepository = null;
      }
    });
  }

  async transactionPessimistic<T>(
    callback: (unitOfWork: UnitOfWork) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const previousManager = this.entityManager;
      this.entityManager = manager;

      // Reset repositories to use new transaction manager
      this.sessionRepository = null;
      this.seatRepository = null;
      this.reservationRepository = null;
      this.saleRepository = null;

      try {
        return await callback(this);
      } finally {
        this.entityManager = previousManager;
        this.sessionRepository = null;
        this.seatRepository = null;
        this.reservationRepository = null;
        this.saleRepository = null;
      }
    });
  }
}
