import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSeatsTable1704067300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'seats',
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
            name: 'seatNumber',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['available', 'reserved', 'sold'],
            default: "'available'",
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
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'seats',
      new TableIndex({
        name: 'IDX_seats_session_number',
        columnNames: ['sessionId', 'seatNumber'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'seats',
      new TableIndex({
        name: 'IDX_seats_session_status',
        columnNames: ['sessionId', 'status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('seats');
  }
}
