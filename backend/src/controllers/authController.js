'use strict';

const jwt  = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User }        = require('../models');
const { createError } = require('../middlewares/errorHandler');

function signAccessToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

function signRefreshToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );
}

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg, 'VALIDATION_ERROR'));
    }

    const { email, password, nombre, apellidos } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return next(createError(409, 'Ya existe una cuenta con ese email', 'EMAIL_ALREADY_EXISTS'));
    }

    const user = await User.create({ email, password_hash: password, nombre, apellidos });

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      token:        signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg, 'VALIDATION_ERROR'));
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(createError(401, 'Email o contraseña incorrectos', 'INVALID_CREDENTIALS'));
    }

    if (!user.activo) {
      return next(createError(403, 'Esta cuenta ha sido desactivada', 'ACCOUNT_DISABLED'));
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return next(createError(401, 'Email o contraseña incorrectos', 'INVALID_CREDENTIALS'));
    }

    return res.status(200).json({
      message: 'Inicio de sesión correcto',
      token:        signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  return res.status(200).json({ message: 'Sesión cerrada correctamente' });
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken: incomingToken } = req.body;
    if (!incomingToken) {
      return next(createError(401, 'Refresh token requerido', 'MISSING_REFRESH_TOKEN'));
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (jwtErr) {
      return next(createError(401, 'Refresh token inválido o expirado', 'INVALID_REFRESH_TOKEN'));
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(createError(404, 'Usuario no encontrado', 'USER_NOT_FOUND'));
    }
    if (!user.activo) {
      return next(createError(403, 'Esta cuenta ha sido desactivada', 'ACCOUNT_DISABLED'));
    }

    return res.status(200).json({
      message:      'Token renovado correctamente',
      token:        signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, refreshToken };
