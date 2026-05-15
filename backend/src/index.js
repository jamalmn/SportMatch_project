'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const { sequelize }   = require('./models');
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
const authRoutes =
  require('./routes/authRoutes');

const userRoutes =
  require('./routes/userRoutes');

const eventRoutes =
  require('./routes/eventRoutes');

const ratingRoutes =
  require('./routes/ratingRoutes');

const notificationRoutes =
  require('./routes/notificationRoutes');

// RUTAS
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);



// ERROR HANDLER
app.use(errorHandler);


// ─── Conexión DB + arranque ──────────────────────────────────────────────────
sequelize
  .authenticate()
  .then(() => sequelize.sync())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('No se pudo conectar a la base de datos:', err);
    process.exit(1);
  });
