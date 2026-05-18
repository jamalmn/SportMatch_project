'use strict';

// Must be set BEFORE any require() so dotenv does not override it
process.env.DB_NAME = 'sportmatch_test';
process.env.NODE_ENV = 'test';

const { sequelize } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
