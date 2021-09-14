import { pick } from 'lodash';
import { DatabaseClient } from "./databaseClient"
interface Indexable {
  [key: string]: unknown
}
type Callback = (obj: Base) => void
const returnTrue = () => true
const returnFalse = () => false
const returnFirst = (a: nay) => a?.[0] ?? null

export class Base implements Indexable {
  [key: string]: any;
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
    return this.knex.select('*')
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
    return obj.save().finally(() => obj)
  }
  static first<T extends typeof Base>(this: T): Promise<InstanceType<T>> {
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
  static destroyBy(props: any) {
    return this.knex.where(props).del().then(returnTrue, returnFalse)
  }
  static destroyAll() {
    return this.knex.del().then(returnTrue, returnFalse)
  }
  destroy() {
    const theClass = (this.constructor as unknown as typeof Base)
    const { primaryKey } = theClass
    return theClass.destroyBy({ [primaryKey]: (this as any)[primaryKey] })
  }
  save<T extends Base>(this: T) {
    const theClass = this.constructor as unknown as typeof Base
    return theClass.knex.columnInfo().then(cols => {
      const props = pick(this, Object.keys(cols))
      return theClass.knex.insert(props).then(returnFirst).then(id => {
        (this as Base).id = id
        return this
      }) as Promise<T>
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
