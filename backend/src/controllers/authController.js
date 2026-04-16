'use strict';

const jwt  = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User }        = require('../models');
const { createError } = require('../middlewares/errorHandler');

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

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      token,
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

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      message: 'Inicio de sesión correcto',
      token,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  return res.status(200).json({ message: 'Sesión cerrada correctamente' });
}

module.exports = { register, login, logout };
