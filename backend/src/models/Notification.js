'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Notification extends Model {
    // Getter virtual: indica si la notificación está pendiente de leer
    get pendiente() {
      return !this.leida;
    }

    // Método de instancia: marca la notificación como leída
    async marcarLeida() {
      this.leida = true;
      this.leida_at = new Date();
      return this.save();
    }
  }

  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      usuario_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      evento_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'events',
          key: 'id',
        },
      },
      tipo: {
        type: DataTypes.ENUM(
          'inscripcion_confirmada',
          'inscripcion_cancelada',
          'lista_espera_promovido',
          'evento_actualizado',
          'evento_cancelado',
          'recordatorio_24h',
          'nueva_valoracion'
        ),
        allowNull: false,
      },
      titulo: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      mensaje: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      leida: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      leida_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      hooks: {
        beforeCreate: (notification) => {
          if (notification.leida && !notification.leida_at) {
            throw new Error('Una notificación leída debe tener fecha de lectura');
          }
          if (!notification.leida && notification.leida_at) {
            throw new Error('Una notificación no leída no puede tener fecha de lectura');
          }
        },
        beforeUpdate: (notification) => {
          if (notification.leida && !notification.leida_at) {
            throw new Error('Una notificación leída debe tener fecha de lectura');
          }
          if (!notification.leida && notification.leida_at) {
            throw new Error('Una notificación no leída no puede tener fecha de lectura');
          }
        },
      },
    }
  );

  return Notification;
};