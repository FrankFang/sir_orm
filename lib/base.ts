import { DatabaseClient } from "./databaseClient"
let client: DatabaseClient | null = null
export class Base {
  static primaryKey = 'id'
  static get tableName() {
    return s(x(this.name))
  }
  static get knex() {
    const config = {
      dialect: 'mysql',
      host: 'mysql1', port: 3306, password: '123456', user: 'root',
      database: 'oh_my_db'
    } as const
    client = client ?? new DatabaseClient(config)
    return client.knex(this.tableName)
  }
  static get all() {
    return this.knex.select('*')
  }
  static create<T extends typeof Base>(this: T, ...propsList: any[]) {
    return this.knex.insert(propsList)
      .then(idList =>
        idList.map((id, index) => new this({ ...propsList[index], id }))
      ).then(modelList => modelList.length <= 1 ? modelList[0] : modelList)
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
  constructor(props: any) {
    Object.assign(this, props)
  }
  destroy() {
    const theClass = (this.constructor as unknown as typeof Base)
    const { primaryKey } = theClass
    return theClass.destroyBy({ [primaryKey]: (this as any)[primaryKey] })
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
