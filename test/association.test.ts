import { Crud } from './../lib/crud';
import { Base } from './../lib/base';
import { prepareTable, ensureDb, getClient, destroyDb } from './helper';
describe('Association', () => {
  describe('supports 1:1 association', () => {
    class User extends Base { }
    class Dog extends Base { }
    User.hasOne = [Dog]
    Dog.belongsTo = [User]
    beforeAll(async () => {
      await ensureDb()
      Base.client = getClient()
    })
    beforeEach(async () => {
      await Base.client.createTableIfNotExists('users', {
        name: 'string', age: 'int'
      }, { increments: true, timestamps: true })
      await Base.client.knex.schema.hasTable('users')
      await Base.client.createTable('dogs', {
        user_id: 'bigint'
      }, { increments: true, timestamps: true })
    })
    afterEach(async () => {
      await Base.client.destroyTable('users')
      await Base.client.destroyTable('dogs')
    })
    afterAll(async () => {
      await destroyDb()
      await Base.client.destroy()
    })
    it('writes associations', async () => {
      const user = await User.create({ name: 'frank' })
      const dog = await Dog.create()
      user.dog = dog
      await user.save()
      expect((await Dog.find(dog.id)).user_id).toEqual(user.id)
    })
    it('reads associations', async () => {
      const u = await User.create({ name: 'frank' })
      await Dog.create({ user_id: u.id })
      const dog = await Dog.first()
      const user = await User.first()
      expect(dog.user.id).toEqual(user.id)
      expect(user.dog.id).toEqual(dog.id)
    })
  })
})