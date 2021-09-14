import { ensureDb, destroyDb, getClient } from './helper';
import { Base } from './../lib/base';
describe('Model Instance', () => {
  class User extends Base { }
  beforeEach(async () => {
    await ensureDb()
    Base.client = getClient()
    await Base.client.createTableIfNotExists('users', {
      name: 'string', age: 'int'
    }, { increments: true, timestamps: true })
  })
  afterEach(async () => {
    await destroyDb()
    Base.client.destroy()
  })
  it('can create a record with #save method', async () => {
    const user = new User(u => u.name = 'frank')
    await user.save()
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
    expect((await User.all).length).toEqual(1)
    await user.destroy()
  })
  it('can update a record', async () => {
    const user = await User.create({ name: 'frank' })
    await user.update({ name: 'jack' })
    const user2 = await User.find({ name: 'jack' })
    expect(user2.id).toEqual(user.id)
  })
})