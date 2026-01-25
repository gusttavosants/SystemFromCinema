import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Session as SessionDomain } from '@domain/cinema/entities/session.entity';
import { ISessionRepository } from '@domain/cinema/repositories/session.repository';
import { Price } from '@domain/cinema/value-objects/price.vo';
import { Session as SessionDB } from '../entities/session.entity';

@Injectable()
export class SessionRepositoryImpl implements ISessionRepository {
  constructor(
    @InjectRepository(SessionDB)
    private readonly sessionRepository: Repository<SessionDB>,
  ) {}

  async create(session: SessionDomain): Promise<void> {
    // Map domain entity to DB entity
    const sessionDB = this.sessionRepository.create({
      id: session.getId(),
      movieTitle: session.getMovieTitle(),
      showTime: session.getShowTime(),
      room: session.getRoom(),
      totalSeats: session.getTotalSeats(),
      price: session.getPrice().getValue(),
      createdAt: session.getCreatedAt(),
    });

    await this.sessionRepository.save(sessionDB);
  }

  async findById(id: string): Promise<SessionDomain | null> {
    const session = await this.sessionRepository.findOne({
      where: { id },
    });

    if (!session) {
      return null;
    }

    return this.mapToDomain(session);
  }

  async findByIdOrThrow(id: string): Promise<SessionDomain> {
    const session = await this.findById(id);
    if (!session) {
      throw new Error(`Session with id ${id} not found`);
    }
    return session;
  }

  async findAll(): Promise<SessionDomain[]> {
    const sessions = await this.sessionRepository.find();
    return sessions.map((s) => this.mapToDomain(s));
  }

  async findUpcomingSessions(limit: number = 10): Promise<SessionDomain[]> {
    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.showTime > :now', { now: new Date() })
      .orderBy('session.showTime', 'ASC')
      .limit(limit)
      .getMany();

    return sessions.map((s) => this.mapToDomain(s));
  }

  async update(session: SessionDomain): Promise<void> {
    const sessionDB = await this.sessionRepository.findOne({
      where: { id: session.getId() },
    });

    if (!sessionDB) {
      throw new Error(`Session with id ${session.getId()} not found`);
    }

    sessionDB.movieTitle = session.getMovieTitle();
    sessionDB.showTime = session.getShowTime();
    sessionDB.room = session.getRoom();
    sessionDB.totalSeats = session.getTotalSeats();
    sessionDB.price = session.getPrice().getValue();

    await this.sessionRepository.save(sessionDB);
  }

  async delete(id: string): Promise<void> {
    await this.sessionRepository.delete(id);
  }

  private mapToDomain(sessionDB: SessionDB): SessionDomain {
    const price = new Price(sessionDB.price);
    return SessionDomain.restore(
      sessionDB.id,
      sessionDB.movieTitle,
      sessionDB.showTime,
      sessionDB.room,
      sessionDB.totalSeats,
      price,
      sessionDB.createdAt,
      sessionDB.version,
    );
  }
}
