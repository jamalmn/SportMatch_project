'use strict';

const { Event, Notification } = require('../models');
const { createError }         = require('../middlewares/errorHandler');

async function getNotifications(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const where = { usuario_id: req.user.id };
    if (req.query.leida !== undefined) {
      where.leida = req.query.leida === 'true';
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order:  [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      include: [{
        model:      Event,
        as:         'evento',
        attributes: ['id', 'titulo', 'deporte', 'fecha_hora'],
        required:   false,
      }],
    });

    const no_leidas = await Notification.count({
      where: { usuario_id: req.user.id, leida: false },
    });

    return res.status(200).json({ total: count, no_leidas, page, limit, notifications: rows });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const [updated] = await Notification.update(
      { leida: true, leida_at: new Date() },
      { where: { usuario_id: req.user.id, leida: false } }
    );

    return res.status(200).json({
      message: 'Todas las notificaciones han sido marcadas como leídas',
      updated,
    });
  } catch (err) {
    next(err);
  }
}

async function markOneRead(req, res, next) {
  try {
    const notification = await Notification.findByPk(req.params.notificationId);

    if (!notification) {
      return next(createError(404, 'Notificación no encontrada', 'NOTIFICATION_NOT_FOUND'));
    }
    if (notification.usuario_id !== req.user.id) {
      return next(createError(403, 'No tienes permiso para acceder a esta notificación', 'FORBIDDEN'));
    }

    await notification.update({ leida: true, leida_at: new Date() });

    return res.status(200).json({ message: 'Notificación marcada como leída', notification });
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const notification = await Notification.findByPk(req.params.notificationId);

    if (!notification) {
      return next(createError(404, 'Notificación no encontrada', 'NOTIFICATION_NOT_FOUND'));
    }
    if (notification.usuario_id !== req.user.id) {
      return next(createError(403, 'No tienes permiso para acceder a esta notificación', 'FORBIDDEN'));
    }

    await notification.destroy();

    return res.status(200).json({ message: 'Notificación eliminada correctamente' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markAllRead, markOneRead, deleteNotification };
