'use strict';

const { validationResult }                    = require('express-validator');
const { sequelize, User, Event, Inscription, Rating } = require('../models');
const { createError }                         = require('../middlewares/errorHandler');

async function createRating(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg, 'VALIDATION_ERROR'));
    }

    const { valorado_id, evento_id, puntuacion, comentario } = req.body;

    // No auto-valoración
    if (valorado_id === req.user.id) {
      return next(createError(400, 'No puedes valorarte a ti mismo', 'SELF_RATING'));
    }

    // Evento finalizado
    const evento = await Event.findByPk(evento_id);
    if (!evento || evento.estado !== 'finalizado') {
      return next(createError(409, 'Solo se puede valorar en eventos finalizados', 'EVENT_NOT_FINISHED'));
    }

    // El valorador asistió
    const valoradorAsistio = await Inscription.findOne({
      where: { evento_id, usuario_id: req.user.id, asistio: true },
    });
    if (!valoradorAsistio) {
      return next(createError(403, 'Solo puedes valorar si tienes confirmada tu asistencia', 'DID_NOT_ATTEND'));
    }

    // El valorado asistió o es el organizador
    const valoradoAsistio = await Inscription.findOne({
      where: { evento_id, usuario_id: valorado_id, asistio: true },
    });
    if (!valoradoAsistio && evento.organizador_id !== valorado_id) {
      return next(createError(409, 'El usuario valorado no tiene confirmada su asistencia', 'RATED_DID_NOT_ATTEND'));
    }

    // Valoración duplicada
    const existing = await Rating.findOne({
      where: { valorador_id: req.user.id, valorado_id, evento_id },
    });
    if (existing) {
      return next(createError(409, 'Ya has valorado a este usuario en este evento', 'RATING_ALREADY_EXISTS'));
    }

    // Crear valoración
    const rating = await Rating.create({
      valorador_id: req.user.id,
      valorado_id,
      evento_id,
      puntuacion,
      comentario,
    });

    // Recalcular rating del valorado
    const stats = await Rating.findOne({
      where:      { valorado_id },
      attributes: [
        [sequelize.fn('AVG',   sequelize.col('puntuacion')), 'promedio'],
        [sequelize.fn('COUNT', sequelize.col('id')),         'total'],
      ],
      raw: true,
    });

    await User.update(
      {
        rating_promedio:    parseFloat(stats.promedio).toFixed(1),
        total_valoraciones: stats.total,
      },
      { where: { id: valorado_id } }
    );

    return res.status(201).json({ message: 'Valoración enviada correctamente', rating });
  } catch (err) {
    next(err);
  }
}

async function getEventRatings(req, res, next) {
  try {
    const { count, rows } = await Rating.findAndCountAll({
      where:   { evento_id: req.params.eventId },
      include: [
        { model: User, as: 'valorador', attributes: ['id', 'nombre', 'foto_perfil'] },
        { model: User, as: 'valorado',  attributes: ['id', 'nombre', 'foto_perfil'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({ total: count, ratings: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { createRating, getEventRatings };
