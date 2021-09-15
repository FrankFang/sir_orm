import { ensureDb, destroyDb, getClient } from './helper';
import { Base } from '../lib/base';
describe('Model Instance', () => {
  beforeAll(async () => {
    await ensureDb()
    Base.client = getClient()
  })
  beforeEach(async () => {
    await Base.client.createTableIfNotExists('users', {
      name: 'string', age: 'int'
    }, { increments: true, timestamps: true })
    await Base.client.knex.schema.hasTable('users')
  })
  afterEach(async() => {
    await Base.client.destroyTable('users')
  })
  afterAll(async() => {
    await destroyDb()
    await Base.client.destroy()
  })
  class User extends Base { }
  it('can create a record with #save method', async () => {
    const user = new User(u => u.name = 'frank')
    const result = await user.save()
    expect(result).toBe(true)
    const user2 = await User.first()
    expect(user2['id']).toBeTruthy()
    expect(user2['name']).toBe('frank')
  })
  it('can create a record with User.create', async () => {
    const user = await User.create(u => u.name = 'frank')
    const user2 = await User.first()
    expect(user2.id).toEqual(user.id)
    expect(user2.name).toEqual(user.name)
  })
  it('can destroy a record', async () => {
    const user = await User.create({ name: 'frank' })
    expect(user.isPersisted).toBe(true)
    expect((await User.all.promise).length).toEqual(1)
    await user.destroy()
  })
  it('can update a record', async () => {
    const user = await User.create({ name: 'frank' })
    await user.update({ name: 'jack' })
    const user2 = await User.find({ name: 'jack' })
    expect(user2.id).toEqual(user.id)
  })
})