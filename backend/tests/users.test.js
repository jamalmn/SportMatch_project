'use strict';

const request = require('supertest');
const app     = require('../src/app');
const { sequelize } = require('../src/models');
const { createUser, createEvent, loginUser } = require('./helpers');

let user, otherUser, token, otherToken;

beforeAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE notifications, ratings, inscriptions, events, users RESTART IDENTITY CASCADE'
  );

  user      = await createUser({ email: 'user@usr.test',  password_hash: 'Test1234!', nombre: 'Main',  apellidos: 'User' });
  otherUser = await createUser({ email: 'other@usr.test', password_hash: 'Test1234!', nombre: 'Other', apellidos: 'User' });

  const [r1, r2] = await Promise.all([
    loginUser(app, 'user@usr.test',  'Test1234!'),
    loginUser(app, 'other@usr.test', 'Test1234!'),
  ]);
  token      = r1.token;
  otherToken = r2.token;
});

beforeEach(async () => {
  await sequelize.query(
    'TRUNCATE TABLE notifications, ratings, inscriptions, events RESTART IDENTITY CASCADE'
  );
});

// ─── GET /api/users/me ───────────────────────────────────────────────────────
describe('GET /api/users/me', () => {
  it('devuelve 200 con el perfil del usuario autenticado', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('user@usr.test');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/users/me ───────────────────────────────────────────────────────
describe('PUT /api/users/me (actualizar perfil)', () => {
  it('actualiza los campos permitidos y devuelve 200 con el usuario actualizado', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'Aficionado al deporte', nivel: 'avanzado' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Perfil actualizado correctamente');
    expect(res.body.user.bio).toBe('Aficionado al deporte');
    expect(res.body.user.nivel).toBe('avanzado');
  });

  it('actualiza deportes_favoritos con un array válido', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ deportes_favoritos: ['futbol', 'padel'] });

    expect(res.status).toBe(200);
    expect(res.body.user.deportes_favoritos).toEqual(['futbol', 'padel']);
  });

  it('ignora campos no permitidos (mass assignment)', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Nuevo', email: 'hack@evil.com', activo: false });

    expect(res.status).toBe(200);
    expect(res.body.user.nombre).toBe('Nuevo');
    expect(res.body.user.email).toBe('user@usr.test'); // email no cambia
  });

  it('devuelve 401 sin token', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .send({ bio: 'Sin auth' });
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/users/:userId ──────────────────────────────────────────────────
describe('GET /api/users/:userId (perfil público)', () => {
  it('devuelve 200 con el perfil público sin email ni password_hash', async () => {
    const res = await request(app).get(`/api/users/${otherUser.id}`);

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password_hash');
    expect(res.body.nombre).toBe('Other');
  });

  it('devuelve 404 si el usuario no existe', async () => {
    const res = await request(app)
      .get('/api/users/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });
});

// ─── GET /api/users/:userId/events ──────────────────────────────────────────
describe('GET /api/users/:userId/events (eventos organizados)', () => {
  it('devuelve 200 con la lista de eventos organizados por el usuario', async () => {
    await createEvent(user.id, { titulo: 'Partido mañana' });
    await createEvent(user.id, { titulo: 'Carrera semanal' });

    const res = await request(app).get(`/api/users/${user.id}/events`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it('devuelve 200 con lista vacía si el usuario no ha organizado eventos', async () => {
    const res = await request(app).get(`/api/users/${otherUser.id}/events`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.events).toHaveLength(0);
  });

  it('filtra por estado cuando se pasa el parámetro ?estado=', async () => {
    await createEvent(user.id, { estado: 'abierto'   });
    await createEvent(user.id, { estado: 'cancelado' });

    const res = await request(app)
      .get(`/api/users/${user.id}/events?estado=abierto`);

    expect(res.status).toBe(200);
    expect(res.body.events.every(e => e.estado === 'abierto')).toBe(true);
  });

  it('devuelve 404 si el usuario no existe', async () => {
    const res = await request(app)
      .get('/api/users/00000000-0000-0000-0000-000000000000/events');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });

  it('incluye paginación (page y limit) en la respuesta', async () => {
    for (let i = 0; i < 3; i++) {
      await createEvent(user.id, { titulo: `Evento ${i}` });
    }

    const res = await request(app)
      .get(`/api/users/${user.id}/events?limit=2&page=1`);

    expect(res.status).toBe(200);
    expect(res.body.events.length).toBeLessThanOrEqual(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
  });
});

// Total: 15 casos de test
//   GET  /api/users/me             → 2 casos
//   PUT  /api/users/me             → 4 casos
//   GET  /api/users/:id            → 2 casos
//   GET  /api/users/:id/events     → 5 casos
