'use strict';

const { Op }                                          = require('sequelize');
const { sequelize, User, Event, Inscription, Notification } = require('../models');
const { createError }                                       = require('../middlewares/errorHandler');

async function joinEvent(req, res, next) {
  try {
    const { eventId } = req.params;

    // 1. Buscar evento
    const evento = await Event.findOne({ where: { id: eventId, deleted_at: null } });
    if (!evento) return next(createError(404, 'Evento no encontrado', 'EVENT_NOT_FOUND'));

    // 2. Estado del evento
    if (evento.estado === 'cancelado' || evento.estado === 'finalizado') {
      return next(createError(409, 'No es posible inscribirse en este evento', 'EVENT_NOT_OPEN'));
    }

    // 3. El organizador no puede inscribirse
    if (evento.organizador_id === req.user.id) {
      return next(createError(403, 'El organizador no puede inscribirse en su propio evento', 'ORGANIZER_CANNOT_JOIN'));
    }

    // 4. Inscripción activa existente
    const existing = await Inscription.findOne({
      where: { evento_id: eventId, usuario_id: req.user.id, estado: ['confirmed', 'waiting'] },
    });
    if (existing) {
      return next(createError(409, 'Ya tienes una inscripción activa en este evento', 'ALREADY_INSCRIBED'));
    }

    // 5. Determinar estado
    const hayPlaza = evento.aforo_actual < evento.aforo_maximo;
    const estado   = hayPlaza ? 'confirmed' : 'waiting';

    // 6. Posición en espera si corresponde
    let posicion_espera = null;
    if (!hayPlaza) {
      posicion_espera = await Inscription.count({ where: { evento_id: eventId, estado: 'waiting' } }) + 1;
    }

    // 7. Transacción
    const inscription = await sequelize.transaction(async (t) => {
      const ins = await Inscription.create(
        { evento_id: eventId, usuario_id: req.user.id, estado, posicion_espera },
        { transaction: t }
      );

      if (hayPlaza) {
        await evento.increment('aforo_actual', { transaction: t });
        if (evento.aforo_actual + 1 === evento.aforo_maximo) {
          await evento.update({ estado: 'completo' }, { transaction: t });
        }
      }

      return ins;
    });

    // 8. Notificación (fuera de la transacción)
    await Notification.create({
      usuario_id: req.user.id,
      evento_id:  eventId,
      tipo:       'inscripcion_confirmada',
      titulo:     'Inscripción confirmada',
      mensaje:    `Te has inscrito en "${evento.titulo}"`,
      leida:      false,
    });

    const message = hayPlaza
      ? 'Inscripción confirmada correctamente'
      : `Añadido a la lista de espera en posición ${posicion_espera}`;

    return res.status(201).json({ message, inscription });
  } catch (err) {
    next(err);
  }
}

async function leaveEvent(req, res, next) {
  let promovido = null;
  let eventoRef  = null;

  try {
    const { eventId } = req.params;

    await sequelize.transaction(async (t) => {
      // 1. Buscar evento con lock
      const evento = await Event.findOne({
        where:       { id: eventId, deleted_at: null },
        transaction: t,
        lock:        t.LOCK.UPDATE,
      });
      if (!evento) throw createError(404, 'Evento no encontrado', 'EVENT_NOT_FOUND');

      eventoRef = evento;

      // 2. Evento finalizado
      if (evento.estado === 'finalizado') {
        throw createError(409, 'No se puede cancelar la inscripción de un evento finalizado', 'EVENT_ALREADY_FINISHED');
      }

      // 3. Inscripción activa
      const inscription = await Inscription.findOne({
        where:       { evento_id: eventId, usuario_id: req.user.id, estado: ['confirmed', 'waiting'] },
        transaction: t,
      });
      if (!inscription) throw createError(404, 'No tienes ninguna inscripción activa en este evento', 'INSCRIPTION_NOT_FOUND');

      // 4. ¿Era confirmed?
      const eraConfirmed = inscription.estado === 'confirmed';

      // 5. Cancelar inscripción
      await inscription.update({ estado: 'cancelled', posicion_espera: null }, { transaction: t });

      // 6. Lógica de promoción si liberó una plaza confirmed
      if (eraConfirmed) {
        await evento.decrement('aforo_actual', { transaction: t });

        // Primero en espera
        const candidato = await Inscription.findOne({
          where:       { evento_id: eventId, estado: 'waiting' },
          order:       [['posicion_espera', 'ASC']],
          transaction: t,
          lock:        t.LOCK.UPDATE,
        });

        if (candidato) {
          await candidato.update({ estado: 'confirmed', posicion_espera: null }, { transaction: t });
          await evento.increment('aforo_actual', { transaction: t });

          // Reordenar cola (desplazar hacia arriba)
          await Inscription.decrement('posicion_espera', {
            where:       { evento_id: eventId, estado: 'waiting', posicion_espera: { [Op.gt]: 1 } },
            transaction: t,
          });

          promovido = candidato;
        }

        // Recargar para ver aforo actualizado
        await evento.reload({ transaction: t });

        if (evento.estado === 'completo' && evento.aforo_actual < evento.aforo_maximo) {
          await evento.update({ estado: 'abierto' }, { transaction: t });
        }
      }
    });

    // 7. Notificación fuera de la transacción
    if (promovido) {
      await Notification.create({
        usuario_id: promovido.usuario_id,
        evento_id:  req.params.eventId,
        tipo:       'lista_espera_promovido',
        titulo:     'Plaza disponible',
        mensaje:    `Hay una plaza libre en "${eventoRef.titulo}". Tu inscripción ha sido confirmada.`,
        leida:      false,
      });
    }

    return res.status(200).json({
      message:       'Inscripción cancelada correctamente',
      promoted_user: promovido?.usuario_id || null,
    });
  } catch (err) {
    next(err);
  }
}

async function getEventInscriptions(req, res, next) {
  try {
    const { eventId } = req.params;
    const { estado }  = req.query;

    const where = { evento_id: eventId };
    if (estado) where.estado = estado;

    const { count, rows } = await Inscription.findAndCountAll({
      where,
      include: [{
        model:      User,
        as:         'usuario',
        attributes: ['id', 'nombre', 'apellidos', 'foto_perfil', 'nivel'],
      }],
      order: [['posicion_espera', 'ASC'], ['fecha_inscripcion', 'ASC']],
    });

    const confirmados = rows.filter(i => i.estado === 'confirmed').length;
    const en_espera   = rows.filter(i => i.estado === 'waiting').length;

    return res.status(200).json({ total: count, confirmados, en_espera, inscriptions: rows });
  } catch (err) {
    next(err);
  }
}

async function markAttendance(req, res, next) {
  try {
    const { eventId, inscriptionId } = req.params;

    if (typeof req.body.asistio !== 'boolean') {
      return next(createError(400, 'El campo asistio debe ser un booleano', 'VALIDATION_ERROR'));
    }

    if (req.event.estado !== 'finalizado') {
      return next(createError(409, 'Solo se puede registrar asistencia en eventos finalizados', 'EVENT_NOT_FINISHED'));
    }

    const inscription = await Inscription.findOne({
      where: { id: inscriptionId, evento_id: eventId },
    });
    if (!inscription) return next(createError(404, 'Inscripción no encontrada', 'INSCRIPTION_NOT_FOUND'));

    await inscription.update({ asistio: req.body.asistio });

    return res.status(200).json({ message: 'Asistencia registrada correctamente', inscription });
  } catch (err) {
    next(err);
  }
}

module.exports = { joinEvent, leaveEvent, getEventInscriptions, markAttendance };
