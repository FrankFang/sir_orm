import { BuilderProxy } from './builder_proxy';
import { returnFirst, returnFalse, plural, camelToSnake, returnTrue, returnNull, returnAssociated } from './helpers';
import { pick, rearg } from 'lodash';
import { DatabaseClient } from "./database_client"
type Callback = (obj: Crud) => void
export class Crud implements Indexable {
  [key: string]: any;
  #noRecord = true
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
  static get tableName() {
    return plural(camelToSnake(this.name))
  }
  constructor(callback?: Callback);
  constructor(props?: Indexable, callback?: Callback);
  constructor(props?: any, callback?: Callback) {
    if (typeof props === 'function') { [props, callback] = [{}, props] }
    Object.assign(this, props)
    callback?.call(null, this)
    const initResult = this.init?.()
    if (initResult instanceof Promise) {
      throw new Error('init can not return a promise, init can not be a async function')
    }
  }
  static async createMany<T extends typeof Crud>(this: T, propsList: any[], callback?: Callback): Promise<InstanceType<T>[]> {
    const result = []
    for (let i = 0; i < propsList.length; i++) {
      const props = propsList[i]
      result.push(await this.create(props, callback))
    }
    return result
  }
  static create<T extends typeof Crud>(this: T, callback?: Callback): Promise<InstanceType<T>>;
  static create<T extends typeof Crud>(this: T, props?: Indexable, callback?: Callback): Promise<InstanceType<T>>;
  static create<T extends typeof Crud>(this: T, props?: any, callback?: Callback): Promise<InstanceType<T>> {
    if (typeof props === 'function') { [props, callback] = [{}, props] }
    const obj = new (this as unknown as typeof Crud)(props, callback) as InstanceType<T>
    return (obj as Crud).save().then(() => obj, () => obj)
  }
  save<T extends Crud>(this: T): Promise<boolean> {
    const theClass = this.constructor as unknown as typeof Crud
    if (this.isPersisted) {
      return Promise.resolve(true)
    } else {
      return theClass.knex.columnInfo().then(cols => {
        const props = pick(this, Object.keys(cols))
        return theClass.knex.insert(props).then(returnFirst).then(id => {
          (this as Crud).id = id
          this.#noRecord = false
          return true
        }, (e) => (console.log(e), false))
      })
    }
  }
  #destroyed = false
  get isPersisted() {
    return !(this.#noRecord || this.#destroyed)
  }
  destroy() {
    const theClass = (this.constructor as unknown as typeof Crud)
    return theClass.knex.where({ id: this.id }).del().then(returnTrue, returnFalse)
      .then(destroyed => this.#destroyed = destroyed)
  }
  update(props: Indexable) {
    const theClass = (this.constructor as unknown as typeof Crud)
    return theClass.update(this.id, props)
  }
  static primaryKey = 'id'
  static get all() {
    return this.queries.proxy.select('*')
  }
  static async first<T extends typeof Crud>(this: T): Promise<InstanceType<T> | null> {
    if (this.loaded) { return this.records[0] as InstanceType<T> }
    return this.knex.first().then(r => r && new this(r)).then(returnAssociated)
  }
  static second<T extends typeof Crud>(this: T): Promise<InstanceType<T>> {
    return this.knex.limit(1).offset(1).then(r => r && new this(r[0]) as InstanceType<T>)
  }
  static third<T extends typeof Crud>(this: T): Promise<InstanceType<T>> {
    return this.knex.limit(1).offset(2).then(r => r && new this(r[0]) as InstanceType<T>)
  }
  static head<T extends typeof Crud>(this: T, n: number): Promise<InstanceType<T>[]> {
    return this.knex.limit(n)
  }
  static find<T extends typeof Crud>(this: T, id: any): Promise<InstanceType<T> | null> {
    return this.knex.where({ id })
      .then(r => r?.[0] ? (new this(r[0]) as InstanceType<T>) : null)
  }
  static findBy<T extends typeof Crud>(this: T, props: any): Promise<InstanceType<T> | null> {
    return this.knex.where(props).then(r => r?.[0] ? (new this(r[0]) as InstanceType<T>) : null, returnNull)

  }
  static where<T extends typeof Crud>(this: T, props: any): Promise<InstanceType<T>[]> {
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
  static _records: Crud[] = []
  static get records() {
    this.load()
    return this._records
  }
  static set recards(value: Crud[]) {
    this._records = value
  }
  static _queries: BuilderProxy
  static get queries() {
    this._queries = this._queries ?? new BuilderProxy(
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
}