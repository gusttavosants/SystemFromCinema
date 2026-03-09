import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSalesTable1704067500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sales',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'reservationId',
            type: 'uuid',
            isNullable: true,
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
            name: 'paymentMethod',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'paymentTransactionId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'confirmed', 'refunded'],
            default: "'pending'",
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
            name: 'confirmedAt',
            type: 'timestamp',
            isNullable: true,
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
      'sales',
      new TableIndex({
        name: 'IDX_sales_session_user',
        columnNames: ['sessionId', 'userId'],
      }),
    );

    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'IDX_sales_user_confirmed',
        columnNames: ['userId', 'confirmedAt'],
      }),
    );

    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'IDX_sales_session_confirmed',
        columnNames: ['sessionId', 'confirmedAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sales');
  }
}
