
require('dotenv').config()

module.exports = {
  "development": {
    "database": "da_petcu21",
    "host": "127.0.0.1",
    "dialect": "postgres",
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "kazoo_snapshot_test",
    "host": "127.0.0.1",
    "dialect": "postgres",
  },
  "production": {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    dialect: 'postgres',
    use_env_variable: 'DATABASE_URL'
  }
}
