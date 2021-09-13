import { DatabaseClient } from '../lib/databaseClient';
describe('databaseClient', () => {
  const dbName = 'sir_db'
  describe('manipulate database.', () => {
    let client
    beforeEach(() => {
      const config = {
        dialect: 'mysql',
        host: 'mysql1', port: 3306, password: '123456', user: 'root'
      } as const
      client = new DatabaseClient(config)
    })
    afterEach(() => {
      client.destroy()
    })
    it('detects database', async () => {
      expect.assertions(3);
      await expect(client.hasDatabase(dbName))
        .resolves.toBe(false)
      await expect(client.createDatabase(dbName))
        .resolves.toBeTruthy()
      await expect(client.hasDatabase(dbName))
        .resolves.toBe(true)
      await client.dropDatabase(dbName)
    })
    it('creates database', async () => {
      expect.assertions(2);
      await expect(client.createDatabaseIfNotExists(dbName))
        .resolves.toBeTruthy()
      await expect(client.createDatabase(dbName))
        .rejects.toThrowError(/database exists/)
    })
    it('drops database', async () => {
      expect.assertions(2);
      await expect(client.createDatabaseIfNotExists(dbName))
        .resolves.toBeTruthy()
      await expect(client.dropDatabase(dbName))
        .resolves.toBeTruthy()

    })
  })
})