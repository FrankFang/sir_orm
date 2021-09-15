import { ensureDb, destroyDb, getClient, connectToServer } from './helper';
import { DatabaseClient } from '../lib/databaseClient';
describe('databaseClient', () => {
  const dbName = 'sir_db_1'
  describe('manipulate database.', () => {
    let client: DatabaseClient
    beforeEach(() => {
      client = connectToServer()
    })
    afterEach(async () => {
      await client.destroy()
    })
    it('can detect a database', async () => {
      expect.assertions(3);
      await expect(client.hasDatabase(dbName))
        .resolves.toBe(false)
      await expect(client.createDatabase(dbName))
        .resolves.toBeTruthy()
      await expect(client.hasDatabase(dbName))
        .resolves.toBe(true)
      await client.destroyDatabase(dbName)
    })
    it('can create a database', async () => {
      expect.assertions(2);
      client.createDatabaseIfNotExists(dbName)
      await expect(client.createDatabaseIfNotExists(dbName))
        .resolves.toBeTruthy()
      await expect(client.createDatabase(dbName))
        .rejects.toThrowError(/database exists/)
    })
    it('can destroy a database', async () => {
      expect.assertions(2);
      await expect(client.createDatabaseIfNotExists(dbName))
        .resolves.toBeTruthy()
      await expect(client.destroyDatabase(dbName))
        .resolves.toBeTruthy()
    })
  })
  // describe('minipulate tables.', () => {
  //   beforeEach(async () => {
  //     await ensureDb()
  //   })
  //   afterEach(async () => {
  //     await destroyDb()
  //   })
  // })
})