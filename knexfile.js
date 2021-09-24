// Update with your config settings.

const {parse} = require('pg-connection-string')
const pgconfig = parse(process.env.DATABASE_URL);
if(process.env.NODE_ENV === 'production') {
  pgconfig.ssl = { rejectUnauthorized: false };
}

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      database: 'docker',
      user:     'postgres',
      password: 'docker'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL ? parse(process.env.DATABASE_URL) : {},
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
