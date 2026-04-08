'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Event extends Model {
    // Getter virtual: plazas disponibles en tiempo real
    get plazas_disponibles() {
      return this.aforo_maximo - this.aforo_actual;
    }

    // Getter virtual: indica si el evento acepta nuevas inscripciones
    get acepta_inscripciones() {
      return this.estado === 'abierto' && this.aforo_actual < this.aforo_maximo;
    }

    // Getter virtual: indica si el evento ha sido eliminado (soft delete)
    get esta_eliminado() {
      return this.deleted_at !== null;
    }
  }

  Event.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organizador_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      titulo: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      deporte: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      ubicacion_lat: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: false,
        validate: {
          min: -90,
          max: 90,
        },
      },
      ubicacion_lng: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: false,
        validate: {
          min: -180,
          max: 180,
        },
      },
      direccion: {
        type: DataTypes.STRING(300),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      fecha_hora: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
          isFuture(value) {
            if (new Date(value) <= new Date()) {
              throw new Error('La fecha del evento debe ser futura');
            }
          },
        },
      },
      duracion_minutos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60,
        validate: {
          min: 1,
        },
      },
      aforo_maximo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 2,
        },
      },
      aforo_actual: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          noExceedMax(value) {
            if (value > this.aforo_maximo) {
              throw new Error('El aforo actual no puede superar el aforo máximo');
            }
          },
        },
      },
      nivel_requerido: {
        type: DataTypes.ENUM('principiante', 'intermedio', 'avanzado'),
        allowNull: false,
        defaultValue: 'principiante',
      },
      estado: {
        type: DataTypes.ENUM('abierto', 'completo', 'cancelado', 'finalizado'),
        allowNull: false,
        defaultValue: 'abierto',
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Event',
      tableName: 'events',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      // Excluir eventos eliminados en todas las consultas por defecto
      defaultScope: {
        where: {
          deleted_at: null,
        },
      },
      scopes: {
        // Scope para incluir eventos eliminados cuando sea necesario
        conEliminados: {},
      },
    }
  );

  return Event;
};