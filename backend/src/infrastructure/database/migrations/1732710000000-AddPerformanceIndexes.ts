import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddPerformanceIndexes1732710000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1732710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index on users.email for faster authentication
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_EMAIL',
        columnNames: ['email'],
        isUnique: true,
      }),
    );

    // Index on reservations.user_id for user reservation history
    await queryRunner.createIndex(
      'reservations',
      new TableIndex({
        name: 'IDX_RESERVATIONS_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    // Index on reservations.session_id for session availability queries
    await queryRunner.createIndex(
      'reservations',
      new TableIndex({
        name: 'IDX_RESERVATIONS_SESSION_ID',
        columnNames: ['session_id'],
      }),
    );

    // Index on reservations.status for filtering active/expired reservations
    await queryRunner.createIndex(
      'reservations',
      new TableIndex({
        name: 'IDX_RESERVATIONS_STATUS',
        columnNames: ['status'],
      }),
    );

    // Composite index on reservations for session availability queries
    await queryRunner.createIndex(
      'reservations',
      new TableIndex({
        name: 'IDX_RESERVATIONS_SESSION_STATUS',
        columnNames: ['session_id', 'status'],
      }),
    );

    // Index on sales.user_id for user purchase history
    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'IDX_SALES_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    // Index on sales.session_id for session sales reports
    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'IDX_SALES_SESSION_ID',
        columnNames: ['session_id'],
      }),
    );

    // Index on seats.session_id for seat availability queries
    await queryRunner.createIndex(
      'seats',
      new TableIndex({
        name: 'IDX_SEATS_SESSION_ID',
        columnNames: ['session_id'],
      }),
    );

    // Index on seats.status for availability filtering
    await queryRunner.createIndex(
      'seats',
      new TableIndex({
        name: 'IDX_SEATS_STATUS',
        columnNames: ['status'],
      }),
    );

    // Composite index on seats for session availability queries
    await queryRunner.createIndex(
      'seats',
      new TableIndex({
        name: 'IDX_SEATS_SESSION_STATUS',
        columnNames: ['session_id', 'status'],
      }),
    );

    // Index on sessions.show_time for upcoming sessions queries
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_SESSIONS_SHOW_TIME',
        columnNames: ['show_time'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('sessions', 'IDX_SESSIONS_SHOW_TIME');
    await queryRunner.dropIndex('seats', 'IDX_SEATS_SESSION_STATUS');
    await queryRunner.dropIndex('seats', 'IDX_SEATS_STATUS');
    await queryRunner.dropIndex('seats', 'IDX_SEATS_SESSION_ID');
    await queryRunner.dropIndex('sales', 'IDX_SALES_SESSION_ID');
    await queryRunner.dropIndex('sales', 'IDX_SALES_USER_ID');
    await queryRunner.dropIndex(
      'reservations',
      'IDX_RESERVATIONS_SESSION_STATUS',
    );
    await queryRunner.dropIndex('reservations', 'IDX_RESERVATIONS_STATUS');
    await queryRunner.dropIndex('reservations', 'IDX_RESERVATIONS_SESSION_ID');
    await queryRunner.dropIndex('reservations', 'IDX_RESERVATIONS_USER_ID');
    await queryRunner.dropIndex('users', 'IDX_USERS_EMAIL');
  }
}
