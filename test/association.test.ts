import { Crud } from './../lib/crud';
import { Base } from './../lib/base';
import { prepareTable, ensureDb, getClient, destroyDb } from './helper';
describe('Association', () => {
  beforeAll(async () => {
    await ensureDb()
    Base.client = getClient()
  })
  afterAll(async () => {
    await destroyDb()
    await Base.client.destroy()
  })
  describe('1:1', () => {
    class User extends Base { }
    class Dog extends Base { }
    User.hasOne = [Dog]
    Dog.belongsTo = [User]
    beforeEach(async () => {
      await Base.client.createTableIfNotExists('users', {
        name: 'string', age: 'int'
      }, { increments: true, timestamps: true })
      await Base.client.createTable('dogs', {
        user_id: 'bigint'
      }, { increments: true, timestamps: true })
    })
    afterEach(async () => {
      await Base.client.destroyTable('users')
      await Base.client.destroyTable('dogs')
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
  describe('1:n', () => {
    class User extends Base { }
    class Article extends Base { }
    User.hasMany = [Article]
    Article.belongsTo = [User]
    beforeEach(async () => {
      await Base.client.createTableIfNotExists('users', {
        name: 'string', age: 'int'
      }, { increments: true, timestamps: true })
      await Base.client.createTable('articles', {
        user_id: 'bigint'
      }, { increments: true, timestamps: true })
    })
    afterEach(async () => {
      await Base.client.destroyTable('users', 'articles')
    })
    it('writes associations', async () => {
      const user = await User.create({ name: 'frank' })
      const articles = await Article.createMany([{}, {}])
      user.articles = articles
      await user.save()
      expect((await Article.where({ user_id: user.id }))).toHaveLength(2)
    })
    it('reads associations', async () => {
      const u = await User.create({ name: 'frank' })
      await Article.createMany([{ user_id: u.id }, { user_id: u.id }])
      const user = await User.first()
      const article1 = await Article.first()
      const article2 = await Article.second()
      expect(user.articles[0].id).toEqual(article1.id)
      expect(user.articles[1].id).toEqual(article2.id)
    })
  })
  describe('n:n', () => {
    class Teacher extends Base { }
    class Student extends Base { }
    Teacher.hasMany = [{ class: Student, through: 'classes' }]
    Student.hasMany = [{ class: Teacher, through: 'classes' }]
    beforeEach(async () => {
      await Base.client.createTable('teachers', {}, { increments: true, timestamps: true })
      await Base.client.createTable('students', {}, { increments: true, timestamps: true })
      await Base.client.createTable('classes', {}, { increments: true, timestamps: true })
    })
    afterEach(async () => {
      await Base.client.destroyTable('teachers', 'students', 'classes')
    })
    it('writes assocications', async () => {
      const t1 = await Teacher.create({})
      const t2 = await Teacher.create({})
      const s1 = await Student.create({})
      const s2 = await Student.create({})
      t1.students.push(s1)
      t1.students.push(s2)
      await t1.save()
      t2.students.push(s1)
      t2.students.push(s2)
      await t2.save()
      const student1 = await Student.find(s1.id)
      expect(student1.teachers[0].id).toEqual(t1.id)
      expect(student1.teachers[1].id).toEqual(t2.id)
      const student2 = await Student.find(s2.id)
      expect(student2.teachers[0].id).toEqual(t1.id)
      expect(student2.teachers[1].id).toEqual(t2.id)
    })

  })
})