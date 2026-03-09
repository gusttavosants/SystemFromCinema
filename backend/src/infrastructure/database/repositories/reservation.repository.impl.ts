import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Reservation as ReservationDomain } from '@domain/booking/entities/reservation.entity';
import { IReservationRepository } from '@domain/booking/repositories/reservation.repository';
import { Price } from '@domain/cinema/value-objects/price.vo';
import { Reservation as ReservationDB } from '../entities/reservation.entity';

@Injectable()
export class ReservationRepositoryImpl implements IReservationRepository {
  constructor(
    @InjectRepository(ReservationDB)
    private readonly reservationRepository: Repository<ReservationDB>,
  ) {}

  async create(reservation: ReservationDomain): Promise<void> {
    const reservationDB = this.reservationRepository.create({
      id: reservation.getId(),
      sessionId: reservation.getSessionId(),
      userId: reservation.getUserId(),
      seatNumber: reservation.getSeatNumbers()[0],
      totalPrice: reservation.getTotalPrice().getValue(),
      expiresAt: reservation.getExpiresAt(),
      status: reservation.getStatus(),
      createdAt: reservation.getCreatedAt(),
    });

    await this.reservationRepository.save(reservationDB);
  }

  async findById(id: string): Promise<ReservationDomain | null> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      return null;
    }

    return this.mapToDomain(reservation);
  }

  async findByIdOrThrow(id: string): Promise<ReservationDomain> {
    const reservation = await this.findById(id);
    if (!reservation) {
      throw new Error(`Reservation with id ${id} not found`);
    }
    return reservation;
  }

  async findBySessionId(sessionId: string): Promise<ReservationDomain[]> {
    const reservations = await this.reservationRepository.find({
      where: { sessionId },
    });

    return reservations.map((r) => this.mapToDomain(r));
  }

  async findByUserId(userId: string): Promise<ReservationDomain[]> {
    const reservations = await this.reservationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return reservations.map((r) => this.mapToDomain(r));
  }

  async findPendingBySessionAndSeats(
    sessionId: string,
    seatNumbers: number[],
  ): Promise<ReservationDomain[]> {
    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.sessionId = :sessionId', { sessionId })
      .andWhere('reservation.seatNumber IN (:...seatNumbers)', { seatNumbers })
      .andWhere('reservation.status = :status', { status: 'pending' })
      .getMany();

    return reservations.map((r) => this.mapToDomain(r));
  }

  async findExpiredReservations(): Promise<ReservationDomain[]> {
    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.expiresAt < :now', { now: new Date() })
      .andWhere('reservation.status = :status', { status: 'pending' })
      .getMany();

    return reservations.map((r) => this.mapToDomain(r));
  }

  async findPendingReservationsBySession(
    sessionId: string,
  ): Promise<ReservationDomain[]> {
    const reservations = await this.reservationRepository.find({
      where: { sessionId, status: 'pending' },
    });

    return reservations.map((r) => this.mapToDomain(r));
  }

  async update(reservation: ReservationDomain): Promise<void> {
    const reservationDB = await this.reservationRepository.findOne({
      where: { id: reservation.getId() },
    });

    if (!reservationDB) {
      throw new Error(`Reservation with id ${reservation.getId()} not found`);
    }

    reservationDB.status = reservation.getStatus();
    reservationDB.expiresAt = reservation.getExpiresAt();

    await this.reservationRepository.save(reservationDB);
  }

  async delete(id: string): Promise<void> {
    await this.reservationRepository.delete(id);
  }

  private mapToDomain(reservationDB: ReservationDB): ReservationDomain {
    const totalPrice = new Price(reservationDB.totalPrice);
    return ReservationDomain.restore(
      reservationDB.id,
      reservationDB.sessionId,
      reservationDB.userId,
      [reservationDB.seatNumber],
      totalPrice,
      reservationDB.expiresAt,
      reservationDB.status,
      reservationDB.createdAt,
      reservationDB.version,
    );
  }
}
