'use strict';

const { Op, Sequelize }                      = require('sequelize');
const { validationResult }                   = require('express-validator');
const { User, Event, Inscription, Notification } = require('../models');
const { createError }                        = require('../middlewares/errorHandler');
const { sendEventCancelledEmail }            = require('../services/emailService');

async function getEvents(req, res, next) {
  try {
    const {
      deporte, nivel, estado,
      fecha, fecha_desde, fecha_hasta, con_plazas,
      search,
      lat, lng, radio_km,
      sort_by, order,
    } = req.query;

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    // ── Where base ──────────────────────────────────────────────────────────
    const where = { deleted_at: null };

    if (estado) {
      where.estado = estado;
    } else {
      where.estado = { [Op.notIn]: ['cancelado', 'finalizado'] };
    }

    if (deporte) where.deporte         = deporte;
    if (nivel)   where.nivel_requerido = nivel;

    if (search) {
      const term = `%${search}%`;
      where[Op.or] = [
        { titulo:      { [Op.iLike]: term } },
        { descripcion: { [Op.iLike]: term } },
      ];
    }

    if (fecha || fecha_desde || fecha_hasta) {
      where.fecha_hora = {};
      if (fecha) {
        const now = new Date();
        if (fecha === 'hoy') {
          where.fecha_hora[Op.gte] = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          where.fecha_hora[Op.lt]  = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        } else if (fecha === 'semana') {
          const day  = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const lunes = new Date(now.getFullYear(), now.getMonth(), diff);
          where.fecha_hora[Op.gte] = lunes;
          where.fecha_hora[Op.lt]  = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 7);
        } else if (fecha === 'mes') {
          where.fecha_hora[Op.gte] = new Date(now.getFullYear(), now.getMonth(), 1);
          where.fecha_hora[Op.lt]  = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
      } else {
        if (fecha_desde) where.fecha_hora[Op.gte] = new Date(fecha_desde);
        if (fecha_hasta) where.fecha_hora[Op.lte] = new Date(fecha_hasta);
      }
    }

    if (con_plazas === 'true') {
      where[Op.and] = [Sequelize.literal('aforo_actual < aforo_maximo')];
    }

    // ── Atributos y filtro geográfico ────────────────────────────────────────
    const attributes = { exclude: ['deleted_at'] };

    const parsedLat   = parseFloat(lat);
    const parsedLng   = parseFloat(lng);
    const parsedRadio = parseFloat(radio_km);
    const geoSearch   = !isNaN(parsedLat) && !isNaN(parsedLng) && !isNaN(parsedRadio);

    const haversine = `(
      6371 * acos(
        cos(radians(${parsedLat})) * cos(radians(ubicacion_lat)) *
        cos(radians(ubicacion_lng) - radians(${parsedLng})) +
        sin(radians(${parsedLat})) * sin(radians(ubicacion_lat))
      )
    )`;

    if (geoSearch) {
      where[Op.and] = [
        ...(where[Op.and] || []),
        Sequelize.literal(`${haversine} <= ${parsedRadio}`),
      ];
      attributes.include = [[Sequelize.literal(haversine), 'distancia_km']];
    }

    // ── Ordenación ───────────────────────────────────────────────────────────
    let orderClause;
    if (sort_by === 'distancia' && geoSearch) {
      orderClause = [[Sequelize.literal(haversine), order || 'ASC']];
    } else if (sort_by === 'created_at') {
      orderClause = [['created_at', order || 'DESC']];
    } else {
      orderClause = [['fecha_hora', order || 'ASC']];
    }

    // ── Query ────────────────────────────────────────────────────────────────
    const { count, rows } = await Event.findAndCountAll({
      where,
      attributes,
      order:  orderClause,
      limit,
      offset: (page - 1) * limit,
      include: [{
        model:      User,
        as:         'organizador',
        attributes: ['id', 'nombre', 'apellidos', 'foto_perfil', 'rating_promedio'],
      }],
    });

    const events = rows.map(e => ({
      ...e.toJSON(),
      plazas_disponibles: e.aforo_maximo - e.aforo_actual,
    }));

    return res.status(200).json({ total: count, page, limit, events });
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(400, errors.array()[0].msg, 'VALIDATION_ERROR'));
    }

    const event = await Event.create({
      ...req.body,
      organizador_id: req.user.id,
      aforo_actual:   0,
      estado:         'abierto',
    });

    return res.status(201).json({ message: 'Evento creado correctamente', event });
  } catch (err) {
    next(err);
  }
}

async function getEventById(req, res, next) {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({
      where: { id: eventId, deleted_at: null },
      include: [
        {
          model:      User,
          as:         'organizador',
          attributes: ['id', 'nombre', 'apellidos', 'foto_perfil', 'rating_promedio', 'total_valoraciones'],
        },
        {
          model: User,
          as:    'participantes',
          through: {
            model:      Inscription,
            where:      { estado: 'confirmed' },
            attributes: ['estado'],
          },
          attributes: ['id', 'nombre', 'apellidos', 'foto_perfil', 'nivel'],
        },
      ],
    });

    if (!event) return next(createError(404, 'Evento no encontrado', 'EVENT_NOT_FOUND'));

    const total_en_espera = await Inscription.count({
      where: { evento_id: eventId, estado: 'waiting' },
    });

    return res.status(200).json({
      ...event.toJSON(),
      plazas_disponibles: event.aforo_maximo - event.aforo_actual,
      total_en_espera,
    });
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const { estado } = req.event;

    if (estado === 'cancelado' || estado === 'finalizado') {
      return next(createError(409, 'No se puede editar un evento cancelado o finalizado', 'EVENT_NOT_EDITABLE'));
    }

    const { aforo_maximo, fecha_hora } = req.body;

    if (aforo_maximo !== undefined && aforo_maximo < req.event.aforo_actual) {
      return next(createError(400, 'El nuevo aforo no puede ser inferior al número de participantes actuales', 'VALIDATION_ERROR'));
    }

    if (fecha_hora !== undefined && new Date(fecha_hora) <= new Date()) {
      return next(createError(400, 'La fecha del evento debe ser posterior a la fecha actual', 'VALIDATION_ERROR'));
    }

    const ALLOWED = [
      'titulo', 'descripcion', 'deporte', 'fecha_hora', 'duracion_minutos',
      'direccion', 'ubicacion_lat', 'ubicacion_lng', 'aforo_maximo', 'nivel_requerido',
    ];

    const fields = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) fields[key] = req.body[key];
    }

    await req.event.update(fields);

    // Notificar a participantes confirmados solo si hubo cambios reales
    if (Object.keys(fields).length > 0) {
      const inscriptions = await Inscription.findAll({
        where: { evento_id: req.event.id, estado: 'confirmed' },
      });

      await Promise.all(inscriptions.map((ins) =>
        Notification.create({
          usuario_id: ins.usuario_id,
          evento_id:  req.event.id,
          tipo:       'evento_actualizado',
          titulo:     'Evento actualizado',
          mensaje:    `El evento "${req.event.titulo}" ha sido modificado por el organizador.`,
          leida:      false,
        })
      ));
    }

    return res.status(200).json({ message: 'Evento actualizado correctamente', event: req.event });
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    if (req.event.estado === 'cancelado') {
      return next(createError(409, 'El evento ya está cancelado', 'EVENT_ALREADY_CANCELLED'));
    }

    await req.event.update({ estado: 'cancelado', deleted_at: new Date() });

    const inscriptions = await Inscription.findAll({
      where: { evento_id: req.event.id, estado: ['confirmed', 'waiting'] },
    });

    await Promise.all(inscriptions.map(async (inscripcion) => {
      await Notification.create({
        usuario_id: inscripcion.usuario_id,
        evento_id:  req.event.id,
        tipo:       'evento_cancelado',
        titulo:     'Evento cancelado',
        mensaje:    `El evento "${req.event.titulo}" ha sido cancelado por el organizador.`,
        leida:      false,
      });

      try {
        const usuario = await User.findByPk(inscripcion.usuario_id, { attributes: ['nombre', 'email'] });
        if (usuario) {
          await sendEventCancelledEmail(
            { name: usuario.nombre, email: usuario.email },
            { title: req.event.titulo, date: req.event.fecha_hora, location: req.event.direccion, sport: req.event.deporte }
          );
        }
      } catch (emailErr) {
        console.error('[email] sendEventCancelledEmail:', emailErr.message);
      }
    }));

    return res.status(200).json({ message: 'Evento cancelado y eliminado correctamente' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getEvents, createEvent, getEventById, updateEvent, deleteEvent };
