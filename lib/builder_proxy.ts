export class BuilderProxy {
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