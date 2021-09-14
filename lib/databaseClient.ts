import { pick } from 'lodash';
import knex, { Knex } from 'knex'
import { EventEmitter } from 'events';
export interface DatabaseConfig {
  dialect: 'mysql' | 'postgresql';
  host: string; port: number;
  password?: string; database?: string;
  user: string;
  pool?: {
    min?: number; max?: number
  }
}

export class DatabaseClient extends EventEmitter {
  knex: Knex
  constructor(public config: DatabaseConfig) {
    super()
    this.knex = knex({
      client: config.dialect,
      connection: pick(config,
        ['host', 'port', 'user', 'password', 'database']),
      pool: config.pool,
    });
  }
  destroy() {
    this.emit('before:destroy')
    this.knex.destroy()
    this.emit('after:destroy')
  }
  testConnection() {
    return this.exec('select 1+1 as result').then(r => r[0][0].result === 2)
  }
  createDatabaseIfNotExists(name: string, extra?: string) {
    return this.exec(`CREATE DATABASE IF NOT EXISTS ?? ${extra ?? ''}`, name)
      .then(r => r[0])
  }
  createDatabase(name: string, extra?: string) {
    return this.exec(`CREATE DATABASE ?? ${extra ?? ''}`, name)
      .then(r => r[0])
  }
  destroyDatabase(name: string) {
    return this.exec(`DROP DATABASE ??`, name)
      .then(r => r[0])
  }
  hasDatabase(name: string) {
    return this.exec(`SHOW DATABASES LIKE ?`, name).then(r => r[0].length !== 0)
  }
  createTableIfNotExists(name: string, columns: Columes, options?: TableOptions) {
    return this.knex.schema.hasTable(name).then(has =>
      has ? null : this.createTable(name, columns, options)
    )
  }
  createTable(name: string, columns: Columes, options?: TableOptions) {
    return this.knex.schema.createTable(
      name, t => buildTable(t, columns, options))
  }
  exec(sql: string, ...bindings: string[]) {
    return this.knex.raw(sql, bindings)
  }

}
const buildTable = (t: Knex.CreateTableBuilder, columns: Columes, options?: TableOptions) => {
  Object.entries(columns ?? []).map(([colName, options]) => {
    if (typeof options === 'string') { options = { type: options } }
    switch (options.type) {
      case 'string':
        t.string(colName)
        break;
      case 'int':
        t.integer(colName)
        break;
      case 'bigint':
        t.bigInteger(colName)
        break;
      default:
        break;
    }
  })
  Object.entries(options ?? []).map(([option, value]) => {
    switch (option) {
      case 'timestamps':
        value && t.timestamps()
        break;
      case 'increments':
        value && t.increments()
        break;
    }
  })
}

type Columes = { [k: string]: ColumnOptions | ColumnOptions['type'] }
type ColumnOptions = {
  type: 'string' | 'int' | 'bigint';
  notNull?: boolean;
}
type TableOptions = {
  increments?: boolean;
  timestamps?: boolean;
}