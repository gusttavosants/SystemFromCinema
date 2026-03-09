import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateReservationsTable1704067400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'reservations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sessionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'seatId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'seatNumber',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'totalPrice',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'confirmed', 'expired', 'cancelled'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['sessionId'],
            referencedTableName: 'sessions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['seatId'],
            referencedTableName: 'seats',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'reservations',
      new TableIndex({
        name: 'IDX_reservations_session_user',
        columnNames: ['sessionId', 'userId'],
      }),
    );

    await queryRunner.createIndex(
      'reservations',
      new TableIndex({
        name: 'IDX_reservations_session_status',
        columnNames: ['sessionId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'reservations',
      new TableIndex({
        name: 'IDX_reservations_user_status',
        columnNames: ['userId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'reservations',
      new TableIndex({
        name: 'IDX_reservations_expires_at',
        columnNames: ['expiresAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('reservations');
  }
}
