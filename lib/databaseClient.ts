import { pick } from 'lodash';
import knex, { Knex } from 'knex'
interface DatabaseConfig {
  dialect: 'mysql' | 'postgresql';
  host: string; port: number;
  password?: string; database?: string;
  user: string;
  pool?: {
    min?: number; max?: number
  }
}

export class DatabaseClient {
  knex: Knex
  constructor(public config: DatabaseConfig) {
    this.knex = knex({
      client: config.dialect,
      connection: pick(config,
        ['host', 'port', 'user', 'password', 'database']),
      pool: config.pool
    });
  }
  destroy() {
    this.knex.destroy()
  }
  testConnection() {
    return this.exec('select 1+1 as result').then(r => r[0][0].result === 2)
  }
  createDatabaseIfNotExists(name: string, extra?: string) {
    return this.exec(`CREATE DATABASE IF NOT EXISTS ?? ${extra ?? ''}`, name)
      .then(r => r[0])
  }
  createDatabase(name: string, extra: string) {
    return this.exec(`CREATE DATABASE ?? ${extra ?? ''}`, name)
      .then(r => r[0])
  }
  dropDatabase(name: string){
    return this.exec(`DROP DATABASE ??`, name)
      .then(r => r[0])
  }
  hasDatabase(name: string) {
    return this.exec(`SHOW DATABASES LIKE ?`, name).then(r => r[0].length !== 0)
  }
  exec(sql: string, ...bindings: string[]) {
    return this.knex.raw(sql, bindings)
  }

}
