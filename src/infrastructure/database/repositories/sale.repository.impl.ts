import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ISaleRepository } from '../../../domain/booking/repositories/sale.repository';
import { Sale as SaleDomain } from '../../../domain/booking/entities/sale.entity';
import { Sale as SaleDB } from '../entities/sale.entity';

@Injectable()
export class SaleRepositoryImpl implements ISaleRepository {
  constructor(
    @InjectRepository(SaleDB)
    private readonly saleRepository: Repository<SaleDB>,
  ) {}

  async create(sale: SaleDomain): Promise<void> {
    const saleDB = this.saleRepository.create({
      id: sale.getId(),
      reservationId: sale.getReservationId(),
      sessionId: sale.getSessionId(),
      userId: sale.getUserId(),
      seatNumber: sale.getSeatNumbers()[0],
      totalPrice: sale.getTotalPrice(),
      createdAt: sale.getCreatedAt(),
    });

    await this.saleRepository.save(saleDB);
  }

  async findById(id: string): Promise<SaleDomain | null> {
    const sale = await this.saleRepository.findOne({
      where: { id },
    });

    if (!sale) {
      return null;
    }

    return this.mapToDomain(sale);
  }

  async findByIdOrThrow(id: string): Promise<SaleDomain> {
    const sale = await this.findById(id);
    if (!sale) {
      throw new Error(`Sale with id ${id} not found`);
    }
    return sale;
  }

  async findByReservationId(reservationId: string): Promise<SaleDomain | null> {
    const sale = await this.saleRepository.findOne({
      where: { reservationId },
    });

    if (!sale) {
      return null;
    }

    return this.mapToDomain(sale);
  }

  async findByUserId(userId: string): Promise<SaleDomain[]> {
    const sales = await this.saleRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return sales.map((s) => this.mapToDomain(s));
  }

  async findBySessionId(sessionId: string): Promise<SaleDomain[]> {
    const sales = await this.saleRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
    });

    return sales.map((s) => this.mapToDomain(s));
  }

  async findBySessionAndSeatNumber(
    sessionId: string,
    seatNumber: number,
  ): Promise<SaleDomain | null> {
    const sale = await this.saleRepository.findOne({
      where: { sessionId, seatNumber },
    });

    if (!sale) {
      return null;
    }

    return this.mapToDomain(sale);
  }

  async update(sale: SaleDomain): Promise<void> {
    const saleDB = await this.saleRepository.findOne({
      where: { id: sale.getId() },
    });

    if (!saleDB) {
      throw new Error(`Sale with id ${sale.getId()} not found`);
    }

    await this.saleRepository.save(saleDB);
  }

  async delete(id: string): Promise<void> {
    await this.saleRepository.delete(id);
  }

  private mapToDomain(saleDB: SaleDB): SaleDomain {
    return SaleDomain.restore(
      saleDB.id,
      saleDB.reservationId,
      saleDB.sessionId,
      saleDB.userId,
      [saleDB.seatNumber],
      saleDB.totalPrice,
      saleDB.confirmedAt,
      saleDB.createdAt,
      saleDB.version,
    );
  }
}
