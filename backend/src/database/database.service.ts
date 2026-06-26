import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

/**
 * Thin wrapper around a single `pg` Pool. Reads are plain parameterized SQL;
 * the geometry is pre-serialized into the `geo_layers` JSONB column by the DB
 * team, so there is no ORM / geometry mapping here.
 *
 * The pool is lazy: constructing it never opens a socket, so the app boots
 * cleanly even when Postgres is down. Queries fail at call time, where the
 * controllers translate them into graceful HTTP errors.
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    const connectionString = config.get<string>(
      'DATABASE_URL',
      'postgresql://hacarthon_user:hacarthon_pass@localhost:5433/hacarthon',
    );
    this.pool = new Pool({ connectionString });
    this.pool.on('error', (err) =>
      this.logger.warn(`Idle pg client error: ${err.message}`),
    );
  }

  query<T extends QueryResultRow = any>(
    text: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  /** Run a set of statements inside a transaction. */
  async withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end().catch(() => undefined);
  }
}
