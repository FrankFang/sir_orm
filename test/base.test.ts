import { ensureDb, destroyDb, getClient, connectToServer } from './helper';
import { Base } from '../lib/base';
describe('Model Class', () => {
  class User extends Base { }
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
  it('can create a record', async () => {
    const r1 = await User.all.promise
    await User.create({ name: 'frank' })
    const r2 = await User.all.promise
    expect(r2.length - r1.length).toEqual(1)
  })
  it('can destroy a record', async () => {
    const user = await User.create({ name: 'frank' })
    const r1 = await User.all.promise
    await User.destroyBy({ id: user.id })
    const r2 = await User.all.promise
    expect(r1.length - r2.length).toEqual(1)
  })
  it('can update a record', async () => {
    const user = await User.create({ name: 'frank' })
    await User.update(user['id'], { name: 'jack' })
    const u1 = await User.find(user['id'])
    expect(u1.name).toEqual('jack')
  })
  it('can get one record', async () => {
    const user = await User.create({ name: 'frank' })
    const user2 = await User.find(user['id'])
    expect(user2['id']).toEqual(user['id'])
  })
  it('gets nothing', async () => {
    const user = await User.find(40400000)
    expect(user).toBeNull()
  })
  it('can get many records', async () => {
    await User.createMany([
      { name: 'frank' },
      { name: 'jack' },
      { name: 'xiaoming' }
    ])
    const userList = await User.all.promise
    expect(userList.length).toBe(3)
  })
  it('can find one record', async () => {
    const [u1, u2, u3] = await User.createMany([
      { name: 'frank' },
      { name: 'jack' },
      { name: 'xiaoming' }
    ])
    const u4 = await User.find(u2.id)
    expect(u4.name).toEqual(u2.name)
  })
})