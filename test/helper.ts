// import 'leaked-handles'
import { omit } from 'lodash';
import { DatabaseClient, DatabaseConfig } from '../lib/database_client';
const clientCache: DatabaseClient[] = []
const testDbName = 'sir_orm_test'
const testDbExtra = 'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
const testConfig = {
  dialect: 'mysql',
  host: 'mysql1', port: 3306, password: '123456', user: 'root',
  database: testDbName
} as const
export const connectToServer = (config?: DatabaseConfig) => {
  return getClient(omit(config ?? testConfig, ['database']))
}
export const getClient = (config?: DatabaseConfig) => {
  if (clientCache[0]) { return clientCache[0] }
  const client = clientCache[0] = new DatabaseClient(config ?? testConfig)
  client.once('after:destroy', () => {
    delete clientCache[0]
  })
  return client
}
export const destroyClient = () => {
  if (clientCache[0]) { clientCache[0].destroy() }
}

export const ensureDb = async (dbName = testDbName, extra = testDbExtra) => {
  const client = connectToServer()
  const result = await client.createDatabaseIfNotExists(dbName, extra)
  await client.destroy()
  return result
}
export const destroyDb = (dbName = testDbName) => {
  const client = getClient()
  return client.hasDatabase(dbName).then(has => {
    return has ? client.destroyDatabase(dbName) : null
  })
}
