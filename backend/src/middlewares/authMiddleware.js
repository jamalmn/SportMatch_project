'use strict';

const jwt = require('jsonwebtoken');
const { User, Event } = require('../models');
const { createError }  = require('./errorHandler');

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError(401, 'Token no proporcionado', 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return next(createError(401, 'Token inválido o expirado', 'UNAUTHORIZED'));
    }

    const user = await User.findByPk(decoded.id);

    if (!user || !user.activo) {
      return next(createError(401, 'Usuario no encontrado o desactivado', 'UNAUTHORIZED'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

async function isOrganizer(req, res, next) {
  try {
    const event = await Event.findByPk(req.params.eventId);

    if (!event) {
      return next(createError(404, 'Evento no encontrado', 'EVENT_NOT_FOUND'));
    }

    if (req.user.id !== event.organizador_id) {
      return next(createError(403, 'Solo el organizador puede realizar esta acción', 'FORBIDDEN'));
    }

    req.event = event;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { verifyToken, isOrganizer };
