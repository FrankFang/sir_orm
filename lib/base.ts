import { pick } from 'lodash';
import { DatabaseClient } from "./databaseClient"
let client: DatabaseClient | null = null
interface X {
  [key: string]: unknown
}
export class Base implements X {
  [key: string]: unknown;
  static primaryKey = 'id'
  static get tableName() {
    return s(x(this.name))
  }
  static _client: DatabaseClient
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
  static createMany<T extends typeof Base>(this: T, ...propsList: any) {
    return this.knex.insert(propsList)
      .then(idList =>
        idList.map((id, index) => new this({ ...propsList[index], id }))
      )
  }
  static create<T extends typeof Base>(this: T, props?: any) {
    return this.createMany(props).then(a => a[0])
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
  constructor(props?: any) {
    Object.assign(this, props)
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
