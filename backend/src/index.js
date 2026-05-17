'use strict';

const path = require('path');
// .env está en la raíz del repo (TFG_JMH/), dos niveles por encima de backend/src/
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const { sequelize }    = require('./models');
const { errorHandler } = require('./middlewares/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middlewares globales ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ─── Rutas ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/events',        require('./routes/eventRoutes'));
app.use('/api/ratings',       require('./routes/ratingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

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
