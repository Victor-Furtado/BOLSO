import { CreateTableBuilder, sql } from 'kysely';

declare module 'kysely' {
	interface CreateTableBuilder<TB, C> {
		withTimestamps(): CreateTableBuilder<TB, C>;
		withUuidPk(): CreateTableBuilder<TB, C>;
	}
}

CreateTableBuilder.prototype.withTimestamps = function () {
	return this.addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`)).addColumn(
		'updated_at',
		'timestamp',
		(col) => col.defaultTo(sql`now()`)
	);
};

CreateTableBuilder.prototype.withUuidPk = function () {
	return this.addColumn('id', 'text', (col) => col.primaryKey());
};
