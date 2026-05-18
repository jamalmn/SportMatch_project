'use strict';

jest.mock('../src/services/emailService', () => ({
  sendInscriptionConfirmedEmail: jest.fn().mockResolvedValue(null),
  sendWaitingListEmail:          jest.fn().mockResolvedValue(null),
  sendPromotedEmail:             jest.fn().mockResolvedValue(null),
  sendEventCancelledEmail:       jest.fn().mockResolvedValue(null),
  sendEventUpdatedEmail:         jest.fn().mockResolvedValue(null),
  sendReminderEmail:             jest.fn().mockResolvedValue(null),
}));

const request = require('supertest');
const app = require('../src/app');
const { sequelize, Notification } = require('../src/models');
const { createUser, createEvent, loginUser } = require('./helpers');

// ─── Usuarios: se crean una sola vez ─────────────────────────────────────────
let organizador, user1, user2, user3;
let tokenOrg, tokenUser1, tokenUser2, tokenUser3;

beforeAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE notifications, ratings, inscriptions, events, users RESTART IDENTITY CASCADE'
  );

  organizador = await createUser({ email: 'org@notif.test',   password_hash: 'Test1234!', nombre: 'Org',   apellidos: 'Test' });
  user1       = await createUser({ email: 'user1@notif.test', password_hash: 'Test1234!', nombre: 'User1', apellidos: 'Test' });
  user2       = await createUser({ email: 'user2@notif.test', password_hash: 'Test1234!', nombre: 'User2', apellidos: 'Test' });
  user3       = await createUser({ email: 'user3@notif.test', password_hash: 'Test1234!', nombre: 'User3', apellidos: 'Test' });

  const [rOrg, rU1, rU2, rU3] = await Promise.all([
    loginUser(app, 'org@notif.test',   'Test1234!'),
    loginUser(app, 'user1@notif.test', 'Test1234!'),
    loginUser(app, 'user2@notif.test', 'Test1234!'),
    loginUser(app, 'user3@notif.test', 'Test1234!'),
  ]);
  tokenOrg   = rOrg.token;
  tokenUser1 = rU1.token;
  tokenUser2 = rU2.token;
  tokenUser3 = rU3.token;
});

beforeEach(async () => {
  await sequelize.query(
    'TRUNCATE TABLE notifications, ratings, inscriptions, events RESTART IDENTITY CASCADE'
  );
});

// ─── Helper: crea una notificación de prueba para un usuario ──────────────────
function makeNotif(usuarioId, overrides = {}) {
  return Notification.create({
    usuario_id: usuarioId,
    tipo:       'inscripcion_confirmada',
    titulo:     'Inscripción confirmada',
    mensaje:    'Te has inscrito en el evento',
    leida:      false,
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/notifications', () => {
  it('devuelve 200 con las notificaciones del usuario autenticado, total y no_leidas', async () => {
    await makeNotif(user1.id);

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('no_leidas');
    expect(res.body).toHaveProperty('notifications');
    expect(Array.isArray(res.body.notifications)).toBe(true);
    expect(res.body.total).toBe(1);
    expect(res.body.no_leidas).toBe(1);
  });

  it('no devuelve notificaciones de otros usuarios', async () => {
    await makeNotif(user2.id);

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.notifications).toHaveLength(0);
  });

  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app).get('/api/notifications');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/notifications/read-all', () => {
  it('marca todas las no leídas como leídas → 200 con updated correcto y no_leidas queda en 0', async () => {
    await Promise.all([
      makeNotif(user1.id),
      makeNotif(user1.id),
    ]);

    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(2);

    const check = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tokenUser1}`);
    expect(check.body.no_leidas).toBe(0);
  });

  it('no afecta a las notificaciones de otros usuarios', async () => {
    await makeNotif(user2.id);

    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(0);

    const check = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tokenUser2}`);
    expect(check.body.no_leidas).toBe(1);
  });

  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app).patch('/api/notifications/read-all');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/notifications/:id/read', () => {
  it('marca una notificación propia como leída → 200 con leida=true y leida_at establecido', async () => {
    const notif = await makeNotif(user1.id);

    const res = await request(app)
      .patch(`/api/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(res.status).toBe(200);
    expect(res.body.notification.leida).toBe(true);
    expect(res.body.notification.leida_at).not.toBeNull();
  });

  it('devuelve 403 al intentar marcar como leída la notificación de otro usuario', async () => {
    const notif = await makeNotif(user2.id);

    const res = await request(app)
      .patch(`/api/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('devuelve 404 si la notificación no existe', async () => {
    const res = await request(app)
      .patch('/api/notifications/00000000-0000-0000-0000-000000000000/read')
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOTIFICATION_NOT_FOUND');
  });

  it('devuelve 401 sin autenticación', async () => {
    const notif = await makeNotif(user1.id);

    const res = await request(app)
      .patch(`/api/notifications/${notif.id}/read`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/notifications/:id', () => {
  it('elimina una notificación propia → 200 y la notificación desaparece de la BD', async () => {
    const notif = await makeNotif(user1.id);

    const res = await request(app)
      .delete(`/api/notifications/${notif.id}`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Notificación eliminada correctamente');

    const deleted = await Notification.findByPk(notif.id);
    expect(deleted).toBeNull();
  });

  it('devuelve 403 al intentar eliminar la notificación de otro usuario', async () => {
    const notif = await makeNotif(user2.id);

    const res = await request(app)
      .delete(`/api/notifications/${notif.id}`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('devuelve 404 si la notificación no existe', async () => {
    const res = await request(app)
      .delete('/api/notifications/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOTIFICATION_NOT_FOUND');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Generación automática de notificaciones', () => {
  it('inscribirse en un evento crea una notificación inscripcion_confirmada para el usuario', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 10 });

    await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    const notif = await Notification.findOne({
      where: { usuario_id: user1.id, tipo: 'inscripcion_confirmada', evento_id: ev.id },
    });

    expect(notif).not.toBeNull();
    expect(notif.leida).toBe(false);
  });

  it('cancelar una inscripción confirmada promueve al primero en espera y crea notificación lista_espera_promovido', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 2 });

    // user1 y user2 llenan el aforo
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenUser1}`);
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenUser2}`);
    // user3 queda en lista de espera
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenUser3}`);

    // user1 cancela → user3 debe ser promovido
    await request(app)
      .delete(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    const notif = await Notification.findOne({
      where: { usuario_id: user3.id, tipo: 'lista_espera_promovido', evento_id: ev.id },
    });

    expect(notif).not.toBeNull();
  });

  it('cancelar un evento crea notificación evento_cancelado para todos los inscritos confirmados', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 10 });

    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenUser1}`);
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenUser2}`);

    await request(app)
      .delete(`/api/events/${ev.id}`)
      .set('Authorization', `Bearer ${tokenOrg}`);

    const notifs = await Notification.findAll({
      where: { tipo: 'evento_cancelado', evento_id: ev.id },
    });

    const recipientIds = notifs.map((n) => n.usuario_id);
    expect(recipientIds).toContain(user1.id);
    expect(recipientIds).toContain(user2.id);
  });
});

// Total: 16 casos de test cubiertos
//   GET    /api/notifications             →  3 casos
//   PATCH  /api/notifications/read-all   →  3 casos
//   PATCH  /api/notifications/:id/read   →  4 casos
//   DELETE /api/notifications/:id        →  3 casos
//   Generación automática (integración)  →  3 casos
