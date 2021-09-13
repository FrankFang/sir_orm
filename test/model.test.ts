import { Base } from './../lib/base';
describe('models', () => {
  class User extends Base { }
  it('creates a record', async () => {
    const r1 = await User.all
    await User.create({ name: 'frank' })
    const r2 = await User.all
    expect(r2.length - r1.length).toEqual(1)
  })
  it('destroys a record', async () => {
    const user = await User.create({ name: 'frank' })
    const r1 = await User.all
    await User.destroyBy({ id: user['id'] })
    const r2 = await User.all
    expect(r1.length - r2.length).toEqual(1)
  })
  it('updates a record', async () => {
    const user = await User.create({ name: 'frank' })
    await User.update(user['id'], { name: 'jack' })
    const u1 = await User.find(user['id'])
    expect(u1.name).toEqual('jack')
  })
  it('gets one record', async () => {
    const user = await User.create({ name: 'frank' })
    const user2 = await User.find(user['id'])
    expect(user2['id']).toEqual(user['id'])
  })
  it('gets nothing', async () => {
    const user = await User.find(40400000)
    expect(user).toBeNull()
  })
  it('gets many records', async () => {
    await User.destroyAll()
    await User.create(
      { name: 'frank' },
      { name: 'jack' },
      { name: 'xiaoming' }
    )
    const userList = await User.all
    expect(userList.length).toBe(3)
  })
})