'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Inscription extends Model {
    // Getter virtual: indica si está en lista de espera
    get en_espera() {
      return this.estado === 'waiting';
    }

    // Getter virtual: indica si está confirmada
    get confirmada() {
      return this.estado === 'confirmed';
    }

    // Getter virtual: indica si está cancelada
    get cancelada() {
      return this.estado === 'cancelled';
    }
  }

  Inscription.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      evento_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
      },
      usuario_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      estado: {
        type: DataTypes.ENUM('confirmed', 'waiting', 'cancelled'),
        allowNull: false,
        defaultValue: 'confirmed',
      },
      posicion_espera: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          coherenciaConEstado(value) {
            if (this.estado === 'waiting' && value == null) {
              throw new Error('Una inscripción en espera debe tener posición de espera');
            }
            if (this.estado !== 'waiting' && value != null) {
              throw new Error('Solo las inscripciones en espera pueden tener posición');
            }
          },
        },
      },
      asistio: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      fecha_inscripcion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Inscription',
      tableName: 'inscriptions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          // Evita inscripciones duplicadas del mismo usuario en el mismo evento
          unique: true,
          fields: ['evento_id', 'usuario_id'],
        },
      ],
      hooks: {
        beforeCreate: (inscription) => {
          if (inscription.estado === 'waiting' && inscription.posicion_espera == null) {
            throw new Error('Una inscripción en espera debe tener posición de espera');
          }
          if (inscription.estado !== 'waiting' && inscription.posicion_espera != null) {
            throw new Error('Solo las inscripciones en espera pueden tener posición');
          }
        },
        beforeUpdate: (inscription) => {
          if (inscription.estado === 'waiting' && inscription.posicion_espera == null) {
            throw new Error('Una inscripción en espera debe tener posición de espera');
          }
          if (inscription.estado !== 'waiting' && inscription.posicion_espera != null) {
            throw new Error('Solo las inscripciones en espera pueden tener posición');
          }
        },
      },
    }
  );

  return Inscription;
};