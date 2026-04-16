'use strict';

const { validationResult } = require('express-validator');
const { Op }                       = require('sequelize');
const { User, Event, Rating, Inscription } = require('../models');
const { createError }              = require('../middlewares/errorHandler');

function getMe(req, res) {
  return res.status(200).json(req.user.toPublicJSON());
}

async function updateMe(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg, 'VALIDATION_ERROR'));
    }

    const ALLOWED = [
      'nombre', 'apellidos', 'bio', 'foto_perfil',
      'ubicacion', 'ubicacion_lat', 'ubicacion_lng',
      'deportes_favoritos', 'nivel',
    ];

    const fields = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }

    await req.user.update(fields);

    return res.status(200).json({
      message: 'Perfil actualizado correctamente',
      user: req.user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
}

async function getMyInscriptions(req, res, next) {
  try {
    const { estado, periodo } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const whereEvento = {};
    if (periodo === 'proximos') whereEvento.fecha_hora = { [Op.gt]:  new Date() };
    if (periodo === 'pasados')  whereEvento.fecha_hora = { [Op.lte]: new Date() };

    const where = { usuario_id: req.user.id };
    if (estado) where.estado = estado;

    const { count, rows } = await Inscription.findAndCountAll({
      where,
      order:  [[{ model: Event, as: 'evento' }, 'fecha_hora', 'ASC']],
      limit,
      offset: (page - 1) * limit,
      include: [{
        model: Event,
        as:    'evento',
        where: { deleted_at: null, ...whereEvento },
        attributes: { exclude: ['descripcion', 'deleted_at'] },
        include: [{
          model:      User,
          as:         'organizador',
          attributes: ['id', 'nombre', 'apellidos', 'foto_perfil'],
        }],
      }],
    });

    return res.status(200).json({ total: count, page, limit, inscriptions: rows });
  } catch (err) {
    next(err);
  }
}

async function getPublicProfile(req, res, next) {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: { exclude: ['password_hash', 'email', 'activo', 'ubicacion_lat', 'ubicacion_lng'] },
    });

    if (!user) return next(createError(404, 'Usuario no encontrado', 'USER_NOT_FOUND'));

    return res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function getUserEvents(req, res, next) {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return next(createError(404, 'Usuario no encontrado', 'USER_NOT_FOUND'));

    const { estado } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const where = { organizador_id: req.params.userId, deleted_at: null };
    if (estado) where.estado = estado;

    const { count, rows } = await Event.findAndCountAll({
      where,
      order:      [['fecha_hora', 'DESC']],
      limit,
      offset:     (page - 1) * limit,
      attributes: { exclude: ['descripcion', 'deleted_at'] },
    });

    return res.status(200).json({ total: count, page, limit, events: rows });
  } catch (err) {
    next(err);
  }
}

async function getUserRatings(req, res, next) {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return next(createError(404, 'Usuario no encontrado', 'USER_NOT_FOUND'));

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const { count, rows } = await Rating.findAndCountAll({
      where:  { valorado_id: req.params.userId },
      order:  [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      include: [
        { model: User,  as: 'valorador', attributes: ['id', 'nombre', 'apellidos', 'foto_perfil'] },
        { model: Event, as: 'evento',    attributes: ['id', 'titulo', 'deporte'] },
      ],
    });

    return res.status(200).json({
      total:           count,
      rating_promedio: user.rating_promedio,
      page,
      limit,
      ratings:         rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe, getMyInscriptions, getPublicProfile, getUserEvents, getUserRatings };
