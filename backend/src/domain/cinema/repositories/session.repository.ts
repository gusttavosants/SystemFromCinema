import { Session } from '../entities/session.entity';

export interface ISessionRepository {
  create(session: Session): Promise<void>;
  findById(id: string): Promise<Session | null>;
  findByIdOrThrow(id: string): Promise<Session>;
  findAll(): Promise<Session[]>;
  findUpcomingSessions(limit?: number): Promise<Session[]>;
  update(session: Session): Promise<void>;
  delete(id: string): Promise<void>;
}
