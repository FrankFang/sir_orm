import { Base } from './../lib/base';
describe('Model Instance', () => {
  class User extends Base { }
  beforeEach(async () => {
    await User.destroyAll()
  })
  it('can save', async () => {
    const user = new User()
    await user.save()
    const user2 = await User.first()
    expect(user2['id']).toBeTruthy()
  })
  it('can destroy', async () => {
    const user = await User.create({ name: 'frank' })
    expect((await User.all).length).toEqual(1)
    await user.destroy()
  })
  it('can update', async () => {
    const user = await User.create({ name: 'frank' })
    await user.update({ name: 'jack' })
    const user2 = await User.find({ name: 'jack' })
    expect(user2.id).toEqual(user.id)
  })
})