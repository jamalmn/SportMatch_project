'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
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

// Importar modelos
const UserModel        = require('./User');
const EventModel       = require('./Event');
const InscriptionModel = require('./Inscription');
const RatingModel      = require('./Rating');
const NotificationModel = require('./Notification');

// Inicializar modelos
const User         = UserModel(sequelize);
const Event        = EventModel(sequelize);
const Inscription  = InscriptionModel(sequelize);
const Rating       = RatingModel(sequelize);
const Notification = NotificationModel(sequelize);

// =============================================================
//  ASOCIACIONES
// =============================================================

// User → Events (un usuario organiza muchos eventos)
User.hasMany(Event, {
  foreignKey: 'organizador_id',
  as: 'eventos_organizados',
});
Event.belongsTo(User, {
  foreignKey: 'organizador_id',
  as: 'organizador',
});

// User → Inscriptions (un usuario tiene muchas inscripciones)
User.hasMany(Inscription, {
  foreignKey: 'usuario_id',
  as: 'inscripciones',
});
Inscription.belongsTo(User, {
  foreignKey: 'usuario_id',
  as: 'usuario',
});

// Event → Inscriptions (un evento tiene muchas inscripciones)
Event.hasMany(Inscription, {
  foreignKey: 'evento_id',
  as: 'inscripciones',
});
Inscription.belongsTo(Event, {
  foreignKey: 'evento_id',
  as: 'evento',
});

// User ↔ Event (muchos a muchos a través de Inscription)
User.belongsToMany(Event, {
  through: Inscription,
  foreignKey: 'usuario_id',
  otherKey: 'evento_id',
  as: 'eventos_inscritos',
});
Event.belongsToMany(User, {
  through: Inscription,
  foreignKey: 'evento_id',
  otherKey: 'usuario_id',
  as: 'participantes',
});

// User → Ratings recibidas
User.hasMany(Rating, {
  foreignKey: 'valorado_id',
  as: 'valoraciones_recibidas',
});
Rating.belongsTo(User, {
  foreignKey: 'valorado_id',
  as: 'valorado',
});

// User → Ratings emitidas
User.hasMany(Rating, {
  foreignKey: 'valorador_id',
  as: 'valoraciones_emitidas',
});
Rating.belongsTo(User, {
  foreignKey: 'valorador_id',
  as: 'valorador',
});

// Event → Ratings
Event.hasMany(Rating, {
  foreignKey: 'evento_id',
  as: 'valoraciones',
});
Rating.belongsTo(Event, {
  foreignKey: 'evento_id',
  as: 'evento',
});

// User → Notifications
User.hasMany(Notification, {
  foreignKey: 'usuario_id',
  as: 'notificaciones',
});
Notification.belongsTo(User, {
  foreignKey: 'usuario_id',
  as: 'usuario',
});

// Event → Notifications
Event.hasMany(Notification, {
  foreignKey: 'evento_id',
  as: 'notificaciones',
});
Notification.belongsTo(Event, {
  foreignKey: 'evento_id',
  as: 'evento',
});

// =============================================================
//  EXPORTAR
// =============================================================

module.exports = {
  sequelize,
  Sequelize,
  User,
  Event,
  Inscription,
  Rating,
  Notification,
};