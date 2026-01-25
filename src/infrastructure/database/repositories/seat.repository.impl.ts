import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Seat, type SeatStatus } from '@domain/cinema/entities/seat.entity';
import { ISeatRepository } from '@domain/cinema/repositories/seat.repository';
import { SeatNumber } from '@domain/cinema/value-objects/seat-number.vo';
import { Seat as SeatDB } from '../entities/seat.entity';

@Injectable()
export class SeatRepositoryImpl implements ISeatRepository {
  constructor(
    @InjectRepository(SeatDB)
    private readonly seatRepository: Repository<SeatDB>,
  ) {}

  async create(seat: Seat): Promise<void> {
    const seatDB = this.seatRepository.create({
      id: seat.id,
      sessionId: seat.sessionId,
      seatNumber: seat.seatNumber.getValue(),
      status: seat.status,
    });
    await this.seatRepository.save(seatDB);
  }

  async findById(id: string): Promise<Seat | null> {
    const seatDB = await this.seatRepository.findOne({
      where: { id },
    });
    return seatDB ? this.mapToDomain(seatDB) : null;
  }

  async findBySessionAndNumber(
    sessionId: string,
    seatNumber: number,
  ): Promise<Seat | null> {
    const seatDB = await this.seatRepository.findOne({
      where: { sessionId, seatNumber },
    });
    return seatDB ? this.mapToDomain(seatDB) : null;
  }

  async findBySessionId(sessionId: string): Promise<Seat[]> {
    const seatsDB = await this.seatRepository.find({
      where: { sessionId },
      order: { seatNumber: 'ASC' },
    });
    return seatsDB.map((seat) => this.mapToDomain(seat));
  }

  async findAvailableSeatsBySession(sessionId: string): Promise<Seat[]> {
    const seatsDB = await this.seatRepository.find({
      where: { sessionId, status: 'available' },
      order: { seatNumber: 'ASC' },
    });
    return seatsDB.map((seat) => this.mapToDomain(seat));
  }

  async findBySessionAndNumbers(
    sessionId: string,
    seatNumbers: number[],
  ): Promise<Seat[]> {
    const seatsDB = await this.seatRepository
      .createQueryBuilder('seat')
      .where('seat.sessionId = :sessionId', { sessionId })
      .andWhere('seat.seatNumber IN (:...seatNumbers)', { seatNumbers })
      .orderBy('seat.seatNumber', 'ASC')
      .getMany();
    return seatsDB.map((seat) => this.mapToDomain(seat));
  }

  async findWithPessimisticLock(
    sessionId: string,
    seatNumbers: number[],
  ): Promise<Seat[]> {
    const seatsDB = await this.seatRepository
      .createQueryBuilder('seat')
      .setLock('pessimistic_write')
      .where('seat.sessionId = :sessionId', { sessionId })
      .andWhere('seat.seatNumber IN (:...seatNumbers)', { seatNumbers })
      .orderBy('seat.seatNumber', 'ASC')
      .getMany();
    return seatsDB.map((seat) => this.mapToDomain(seat));
  }

  async update(seat: Seat): Promise<void> {
    const seatDB = await this.seatRepository.findOne({
      where: { id: seat.id },
    });

    if (!seatDB) {
      throw new Error(`Seat with id ${seat.id} not found`);
    }

    seatDB.status = seat.status;
    await this.seatRepository.save(seatDB);
  }

  async updateStatus(seatId: string, status: SeatStatus): Promise<void> {
    await this.seatRepository.update({ id: seatId }, { status });
  }

  private mapToDomain(seatDB: SeatDB): Seat {
    return Seat.restore({
      id: seatDB.id,
      sessionId: seatDB.sessionId,
      seatNumber: new SeatNumber(seatDB.seatNumber),
      status: seatDB.status,
    });
  }
}
