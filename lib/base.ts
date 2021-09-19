import { camelToSnake, returnAssociated, plural } from './helpers';
import { Crud } from './crud'

export class Base extends Crud {
  static hasMany: Array<(typeof Base) | { class: typeof Base, through: string }> = []
  static hasOne: Array<typeof Base> = []
  static belongsTo: Array<typeof Base> = []
  init() {
    const theClass = (this.constructor as typeof Base)
    for (const c of theClass.hasOne) {
      this[camelToSnake(c.name)] = null
    }
    for (const c of theClass.belongsTo) {
      this[camelToSnake(c.name)] = null
    }
    for (const c of theClass.hasMany) {
      console.log(theClass.hasMany)
      if ('class' in c) {
        console.log('11111111111111111111')
        console.log('c.class.name')
        console.log(c.class.name)
        this[plural(camelToSnake(c.class.name))] = []
      } else {
        console.log('22222222222222222222')
        console.log('c.name')
        console.log(c.name)
        this[plural(camelToSnake(c.name))] = []
      }
    }
  }
  static async first<T extends typeof Crud>(this: T, options = { withAssociation: true }): Promise<InstanceType<T>> {
    return super.first().then(obj => {
      const o = obj as unknown as InstanceType<T>
      return o &&
        options.withAssociation ? o.loadAssociations() : o
    })
  }
  static find<T extends typeof Crud>(this: T, id: any, options = { withAssociation: true }): Promise<InstanceType<T> | null> {
    return super.find(id).then(obj => {
      const o = obj as unknown as InstanceType<T>
      return o &&
        options.withAssociation ? o.loadAssociations() : o
    })
  }
  static findBy<T extends typeof Crud>(this: T, props: any, options = { withAssociation: true }): Promise<InstanceType<T> | null> {
    return super.findBy(props).then(obj => {
      const o = obj as unknown as InstanceType<T>
      return obj &&
        options.withAssociation ? o.loadAssociations() : o
    })
  }
  static where<T extends typeof Crud>(this: T, props: any, options = { withAssociation: true }): Promise<InstanceType<T>[]> {
    return this.knex.where(props).then(rs => {
      const list = rs.map(r => new this(r) as InstanceType<T>)
      return options.withAssociation ? Promise.all(list) : list
    })
  }
  async loadAssociations() {
    const theClass = (this.constructor as typeof Base)
    for (const c of theClass.hasOne) {
      const key = camelToSnake(c.name)
      if (this[key]) continue
      this[key] = await c.findBy({ [`${camelToSnake(theClass.name)}_id`]: this.id }, { withAssociation: false })
    }
    for (const c of theClass.belongsTo) {
      const key = camelToSnake(c.name)
      if (this[key]) continue
      this[key] = this[`${key}_id`] ?
        await c.find(this[`${key}_id`]) :
        null
    }
    for (const c of theClass.hasMany) {
      const klass = 'class' in c ? c.class : c
      const className = klass.name
      const keys = plural(camelToSnake(className))
      if (this[keys].length > 0) continue
      this[keys] = await klass.where({ [`${camelToSnake(theClass.name)}_id`]: this.id }, { withAssociation: false })
    }
    return this
  }
  async save<T extends Crud>(this: T): Promise<boolean> {
    const result: boolean = await super.save()
    const theClass = (this.constructor as typeof Base)
    for (const c of theClass.hasOne) {
      if (this[camelToSnake(c.name)] === null) { break }
      this[camelToSnake(c.name)][camelToSnake(theClass.name)] = this
      await this[camelToSnake(c.name)].save()
    }
    for (const c of theClass.hasMany) {
      const className = 'class' in c ? c.class.name : c.name
      if (this[plural(camelToSnake(className))]?.length === 0) { break }
      for (const obj of this[plural(camelToSnake(className))]) {
        obj[camelToSnake(theClass.name)] = this
        await obj.save()
      }
    }
    for (const c of theClass.belongsTo) {
      if (this[camelToSnake(c.name)] === null) { break }
      const key = `${camelToSnake(c.name)}_id`
      await this.update({ [key]: this[camelToSnake(c.name)].id })
    }
    return result
  }
}
