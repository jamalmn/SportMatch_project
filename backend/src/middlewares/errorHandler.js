'use strict';

const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
} = require('sequelize');

// ─── Helper para errores operacionales ───────────────────────────────────────
function createError(statusCode, message, code) {
  const err  = new Error(message);
  err.statusCode = statusCode;
  err.code       = code;
  return err;
}

// ─── Middleware centralizado de errores ───────────────────────────────────────
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Errores de validación de Sequelize
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error:   true,
      message: err.errors[0].message,
      code:    'VALIDATION_ERROR',
    });
  }

  // Violación de unicidad
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      error:   true,
      message: 'Ya existe un registro con esos datos',
      code:    'CONFLICT',
    });
  }

  // Violación de clave foránea
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      error:   true,
      message: 'No se puede realizar la operación por restricciones de integridad',
      code:    'CONFLICT',
    });
  }

  // Errores operacionales lanzados con createError()
  if (err.statusCode && err.code) {
    return res.status(err.statusCode).json({
      error:   true,
      message: err.message,
      code:    err.code,
    });
  }

  // Fallback: error inesperado
  const body = {
    error:   true,
    message: 'Ha ocurrido un error interno del servidor',
    code:    'INTERNAL_ERROR',
  };

  if (process.env.NODE_ENV !== 'production') {
    body.detail = err.message;
    body.stack  = err.stack;
  }

  return res.status(500).json(body);
}

module.exports = { errorHandler, createError };
