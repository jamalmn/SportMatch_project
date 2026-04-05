'use strict';

const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    // Método de instancia: compara contraseña en texto plano con el hash
    async comparePassword(plainPassword) {
      return bcrypt.compare(plainPassword, this.password_hash);
    }

    // Método de instancia: devuelve el perfil público sin datos sensibles
    toPublicJSON() {
      const { password_hash, ...publicData } = this.toJSON();
      return publicData;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      apellidos: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      foto_perfil: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      ubicacion: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      ubicacion_lat: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: true,
        validate: {
          min: -90,
          max: 90,
        },
      },
      ubicacion_lng: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: true,
        validate: {
          min: -180,
          max: 180,
        },
      },
      deportes_favoritos: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: [],
      },
      nivel: {
        type: DataTypes.ENUM('principiante', 'intermedio', 'avanzado'),
        allowNull: false,
        defaultValue: 'principiante',
      },
      rating_promedio: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: 0,
          max: 5,
        },
      },
      total_valoraciones: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        // Antes de crear un usuario, hashea la contraseña automáticamente
        beforeCreate: async (user) => {
          if (user.password_hash) {
            user.password_hash = await bcrypt.hash(user.password_hash, 10);
          }
        },
        // Antes de actualizar, hashea solo si la contraseña cambió
        beforeUpdate: async (user) => {
          if (user.changed('password_hash')) {
            user.password_hash = await bcrypt.hash(user.password_hash, 10);
          }
        },
      },
    }
  );

  return User;
};