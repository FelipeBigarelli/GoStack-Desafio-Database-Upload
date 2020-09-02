import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, Table } from 'typeorm';

export class AddCategoryIdToTransactions1598975760915 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.addColumn(
        'transactions',
        new TableColumn({
          name: 'category_id',
          type: 'uuid',
          isNullable: true,
        }),
      );

      await queryRunner.createForeignKey(
        'transactions',
        new TableForeignKey({
          name: 'TransactionCategory',
          columnNames: ['category_id'],
          referencedTableName: 'categories',
          referencedColumnNames: ['id'],
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        })
      );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropForeignKey('transactions', 'TransactionCategory');
      await queryRunner.dropColumn('transactions', 'category_id');
    }

}
