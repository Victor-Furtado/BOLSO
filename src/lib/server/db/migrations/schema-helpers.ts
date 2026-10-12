import { CreateTableBuilder, sql } from 'kysely';

declare module 'kysely' {
	interface CreateTableBuilder<TB, C> {
		withTimestamps(): CreateTableBuilder<TB, C>;
		withUuidPk(): CreateTableBuilder<TB, C>;
	}
}

CreateTableBuilder.prototype.withTimestamps = function () {
	return this.addColumn('created_at', 'text', (col) =>
		col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
	).addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`));
};

CreateTableBuilder.prototype.withUuidPk = function () {
	return this.addColumn('id', 'text', (col) => col.notNull().primaryKey());
};
