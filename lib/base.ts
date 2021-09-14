import { pick } from 'lodash';
import { DatabaseClient } from "./databaseClient"
let client: DatabaseClient | null = null
interface Indexable {
  [key: string]: unknown
}
type Callback = (obj: Base) => void
export class Base implements Indexable {
  [key: string]: unknown;
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
  static createMany(propsList: any[], callback?: Callback) {
    const instanceList = propsList.map(props => new this(props, callback))
    return this.knex.insert(instanceList)
      .then(idList =>
        instanceList.map((instance, index) => {
          instance.id = idList[index]
          return instance
        })
      )
  }
  static create(callback?: Callback): Promise<Base>;
  static create(props?: Indexable, callback?: Callback): Promise<Base>;
  static create(props?: any, callback?: Callback): Promise<Base> {
    if (typeof props === 'function') { [props, callback] = [{}, props] }
    return this.createMany([props ?? {}], callback).then(a => a[0])
  }
  static first() {
    return this.knex.first().then(r => r && new this(r))
  }
  static second() {
    return this.knex.limit(1).offset(1)
  }
  static third() {
    return this.knex.limit(1).offset(2)
  }
  static head(n: number) {
    return this.knex.limit(n)
  }
  static find(id: any) {
    return this.knex.where({ id }).then(r => r?.[0] ?? null)
  }
  static findBy(props: any) {
    return this.knex.where(props).then(r => r?.[0] ?? null)
  }
  static where(props: any) {
    return this.knex.where(props)
  }
  static updateAll(props: any) {
    return this.knex.update(props)
  }
  static update(id: any, props: any) {
    return this.knex.where({ id }).update(props)
  }
  static destroyBy(props: any) {
    return this.knex.where(props).del()
  }
  static destroyAll() {
    return this.knex.del()
  }
  static doQuery() {
  }
  destroy() {
    const theClass = (this.constructor as unknown as typeof Base)
    const { primaryKey } = theClass
    return theClass.destroyBy({ [primaryKey]: (this as any)[primaryKey] })
  }
  save() {
    const theClass = (this.constructor as unknown as typeof Base)
    return theClass.knex.columnInfo().then(cols => {
      const props = pick(this, Object.keys(cols))
      return theClass.create(props)
    })
  }
  update(props: unknown) {
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
