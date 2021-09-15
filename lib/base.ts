import { pick } from 'lodash';
import { DatabaseClient } from "./databaseClient"
import { Knex } from 'knex'
interface Indexable {
  [key: string]: unknown
}
type Callback = (obj: Base) => void
const returnTrue = () => true
const returnFalse = () => false
const returnFirst = (a: nay) => a?.[0] ?? null

class X {
  proxy: Proxy<Knex.QueryBuilder>
  builder: Knex.QueryBuilder
  proxyHandler: ProxyHandler<Knex.QueryBuilder> = {
    get: (target, prop, receiver) => {
      switch (prop) {
        case 'then':
          throw new Error(`Method .then is not found`)
          break;
        case 'promise':
          return this.execute()
          break;
        default:
          return Reflect.get(this.builder!, prop, receiver)
          break;
      }
    }
  }
  constructor(public createBuilder: () => Knex.QueryBuilder) {
    this.builder = this.createBuilder()
    this.proxy = new Proxy(this.builder, this.proxyHandler);
  }
  execute() {
    return this.builder.then().finally(() => {
      this.builder = this.createBuilder()
      this.proxy = new Proxy(this.builder, this.proxyHandler);
    })
  }
}

export class Base implements Indexable {
  [key: string]: any;
  static _records: Base[] = []
  static get records() {
    this.load()
    return this._records
  }
  static set recards(value: Base[]) {
    this._records = value
  }
  static _queries: X
  static get queries() {
    this._queries = this._queries ?? new X(
      () => {
        return this.knex
      })
    return this._queries
  }
  static set queries(value) {
    this._queries = value
  }
  static loaded = false
  static async load() {
    if (!this.loaded) {
      await this.execQueries()
      this.loaded = true
    }
  }
  static async execQueries() {

  }
  static primaryKey = 'id'
  constructor(callback: Callback);
  constructor(props: Indexable, callback?: Callback);
  constructor(props?: any, callback?: Callback) {
    if (typeof props === 'function') { [props, callback] = [{}, props] }
    Object.assign(this, props)
    callback?.call(null, this)
  }
  static get tableName() {
    return s(x(this.name))
  }
  private static _client: DatabaseClient
  static get client() {
    return this._client
  }
  static set client(newClient: DatabaseClient) {
    this._client = newClient
  }
  static get knex() {
    return this.client.knex(this.tableName)
  }
  static get all() {
    return this.queries.proxy.select('*')
  }
  static async createMany<T extends typeof Base>(this: T, propsList: any[], callback?: Callback): Promise<InstanceType<T>[]> {
    const result = []
    for (let i = 0; i < propsList.length; i++) {
      const props = propsList[i]
      result.push(await this.create(props, callback))
    }
    return result
  }
  static create<T extends typeof Base>(this: T, callback?: Callback): Promise<InstanceType<T>>;
  static create<T extends typeof Base>(this: T, props?: Indexable, callback?: Callback): Promise<InstanceType<T>>;
  static create<T extends typeof Base>(this: T, props?: any, callback?: Callback): Promise<InstanceType<T>> {
    if (typeof props === 'function') { [props, callback] = [{}, props] }
    const obj = new this(props, callback) as InstanceType<T>
    return obj.save().then(() => obj, () => obj)
  }
  static async first<T extends typeof Base>(this: T): Promise<InstanceType<T>> {
    if (this.loaded) { return this.records[0] as InstanceType<T> }

    return this.knex.first().then(r => r && new this(r))
  }
  static second<T extends typeof Base>(this: T): Promise<InstanceType<T>> {
    return this.knex.limit(1).offset(1).then(r => r && new this(r[0]) as InstanceType<T>)
  }
  static third<T extends typeof Base>(this: T): Promise<InstanceType<T>> {
    return this.knex.limit(1).offset(2).then(r => r && new this(r[0]) as InstanceType<T>)
  }
  static head<T extends typeof Base>(this: T, n: number): Promise<InstanceType<T>[]> {
    return this.knex.limit(n)
  }
  static find<T extends typeof Base>(this: T, id: any): Promise<InstanceType<T>> {
    return this.knex.where({ id }).then(r => r?.[0] ?? null)
  }
  static findBy<T extends typeof Base>(this: T, props: any): Promise<InstanceType<T>> {
    return this.knex.where(props).then(r => r?.[0] ?? null)
  }
  static where<T extends typeof Base>(this: T, props: any): Promise<InstanceType<T>[]> {
    return this.knex.where(props).then(rs => rs.map(r => r && new this(r) as InstanceType<T>))
  }
  static updateAll(props: Indexable) {
    return this.knex.update(props).then(returnTrue, returnFalse)
  }
  static update(id: any, props: Indexable) {
    return this.knex.where({ id }).update(props).then(returnTrue, returnFalse)
  }
  static async destroyBy(props: any) {
    const objects = await this.where(props)
    for (const o of objects) {
      if (await o.destroy() === false) return false
    }
    return true
  }
  static destroyAll() {
    return this.knex.del().then(returnTrue, returnFalse)
  }
  destroy() {
    const theClass = (this.constructor as unknown as typeof Base)
    return theClass.knex.where({ id: this.id }).del().then(returnTrue, returnFalse)
      .then(destroyed => this.#destroyed = destroyed)
  }
  #destroyed = false
  #noRecord = true
  get isPersisted() {
    return !(this.#noRecord || this.#destroyed)
  }
  save<T extends Base>(this: T) {
    const theClass = this.constructor as unknown as typeof Base
    return theClass.knex.columnInfo().then(cols => {
      const props = pick(this, Object.keys(cols))
      return theClass.knex.insert(props).then(returnFirst).then(id => {
        (this as Base).id = id
        this.#noRecord = false
        return true
      }, returnFalse)
    })
  }
  update(props: Indexable) {
    const theClass = (this.constructor as unknown as typeof Base)
    return theClass.update(this.id, props)
  }
}

const x = (className: string) =>
  className
    .replace(/([A-Z])/g,
      (match: string, capture1: string) => `_${capture1.toLowerCase()}`)
    .replace(/^_/, '')
const s = (str: string) => {
  const map: { [key: string]: string } = {
    person: 'people',
    quiz: 'quizzes'
  }
  return str + (map[str] ?? 's')
}
