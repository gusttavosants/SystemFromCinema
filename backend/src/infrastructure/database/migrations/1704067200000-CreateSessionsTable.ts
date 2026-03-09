import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSessionsTable1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'movieTitle',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'showTime',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'room',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'totalSeats',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'price',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
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
      }),
      true,
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_movie_show',
        columnNames: ['movieTitle', 'showTime'],
      }),
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_show_time',
        columnNames: ['showTime'],
      }),
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_room',
        columnNames: ['room'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sessions');
  }
}
