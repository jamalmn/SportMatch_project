'use strict';

const cron = require('node-cron');
const { Op }  = require('sequelize');
const { Event, Inscription, Notification } = require('../models');

// Envía notificaciones recordatorio_24h a todos los participantes confirmados
// de eventos que se celebran en las próximas 24 horas, evitando duplicados.
async function enviarRecordatorios() {
  const now   = new Date();
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const eventos = await Event.findAll({
    where: {
      deleted_at: null,
      estado:     { [Op.notIn]: ['cancelado', 'finalizado'] },
      fecha_hora: { [Op.between]: [now, in25h] },
    },
  });

  for (const evento of eventos) {
    const [inscriptions, yaNotificados] = await Promise.all([
      Inscription.findAll({
        where: { evento_id: evento.id, estado: 'confirmed' },
      }),
      Notification.findAll({
        where:      { evento_id: evento.id, tipo: 'recordatorio_24h' },
        attributes: ['usuario_id'],
      }),
    ]);

    const yaNotificadosSet = new Set(yaNotificados.map((n) => n.usuario_id));

    const pendientes = inscriptions.filter((ins) => !yaNotificadosSet.has(ins.usuario_id));

    await Promise.all(
      pendientes.map((ins) =>
        Notification.create({
          usuario_id: ins.usuario_id,
          evento_id:  evento.id,
          tipo:       'recordatorio_24h',
          titulo:     'Recordatorio: evento mañana',
          mensaje:    `Tu evento "${evento.titulo}" es mañana. ¡No olvides asistir!`,
          leida:      false,
        })
      )
    );

    if (pendientes.length > 0) {
      console.log(`[scheduler] recordatorio_24h: ${pendientes.length} notificaciones para "${evento.titulo}"`);
    }
  }
}

// Scheduler de recordatorios automáticos — se ejecuta cada día a las 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('[scheduler] Ejecutando recordatorios 24h —', new Date().toISOString());
  try {
    await enviarRecordatorios();
  } catch (err) {
    console.error('[scheduler] Error en recordatorios 24h:', err.message);
  }
});
