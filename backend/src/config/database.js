'use strict';

const path = require('path');
// .env está en la raíz del repo (TFG_JMH/), tres niveles por encima de backend/src/config/
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { Sequelize } = require('sequelize');

// Railway y otros proveedores cloud inyectan DATABASE_URL como cadena de conexión única.
// En desarrollo seguimos usando las variables individuales del .env.
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
      }
    );

module.exports = sequelize;