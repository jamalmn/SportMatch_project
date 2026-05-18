'use strict';

const path = require('path');
// .env está en la raíz del repo (TFG_JMH/), dos niveles por encima de backend/src/
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

// ─── Estrategia de sincronización según entorno ──────────────────────────────
// test:        force:true  — recrea tablas en cada ejecución (BD limpia para tests)
// development: alter:true  — crea/actualiza tablas sin borrar datos (onboarding sin SQL manual)
// production:  sin sync    — el esquema se gestiona con backend/database/sportmatch_schema.sql
function getSyncOptions() {
  switch (process.env.NODE_ENV) {
    case 'test':        return { force: true };
    case 'development': return { alter: true };
    default:            return null;
  }
}

// ─── Conexión DB + arranque ──────────────────────────────────────────────────
sequelize
  .authenticate()
  .then(() => {
    const syncOpts = getSyncOptions();
    return syncOpts ? sequelize.sync(syncOpts) : Promise.resolve();
  })
  .then(() => {
    // Scheduler de recordatorios automáticos (no aplica en tests)
    if (process.env.NODE_ENV !== 'test') {
      require('./services/schedulerService');
    }

    app.listen(PORT, () => {
      console.log(`[${process.env.NODE_ENV}] Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('No se pudo conectar a la base de datos:', err);
    process.exit(1);
  });
