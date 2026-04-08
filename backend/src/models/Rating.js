'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Rating extends Model {}

  Rating.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      valorado_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      valorador_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      evento_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
      },
      puntuacion: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comentario: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Rating',
      tableName: 'ratings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        {
          // Un usuario solo puede valorar a otro una vez por evento
          unique: true,
          fields: ['valorado_id', 'valorador_id', 'evento_id'],
        },
      ],
      hooks: {
        beforeCreate: (rating) => {
          if (rating.valorado_id === rating.valorador_id) {
            throw new Error('Un usuario no puede valorarse a sí mismo');
          }
        },
      },
    }
  );

  return Rating;
};