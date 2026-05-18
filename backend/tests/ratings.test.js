'use strict';

const request = require('supertest');
const app  = require('../src/app');
const { sequelize, User } = require('../src/models');
const { createUser, createEvent, createInscription, loginUser } = require('./helpers');

// ─── Usuarios: se crean una sola vez ─────────────────────────────────────────
let organizador, valorador, valorado, extraUser;
let tokenOrg, tokenValorador, tokenValorado, tokenExtra;

beforeAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE notifications, ratings, inscriptions, events, users RESTART IDENTITY CASCADE'
  );

  organizador = await createUser({ email: 'org@rat.test',   password_hash: 'Test1234!', nombre: 'Org',    apellidos: 'Test' });
  valorador   = await createUser({ email: 'rater@rat.test', password_hash: 'Test1234!', nombre: 'Rater',  apellidos: 'Test' });
  valorado    = await createUser({ email: 'rated@rat.test', password_hash: 'Test1234!', nombre: 'Rated',  apellidos: 'Test' });
  extraUser   = await createUser({ email: 'extra@rat.test', password_hash: 'Test1234!', nombre: 'Extra',  apellidos: 'Test' });

  const [rOrg, rRater, rRated, rExtra] = await Promise.all([
    loginUser(app, 'org@rat.test',   'Test1234!'),
    loginUser(app, 'rater@rat.test', 'Test1234!'),
    loginUser(app, 'rated@rat.test', 'Test1234!'),
    loginUser(app, 'extra@rat.test', 'Test1234!'),
  ]);
  tokenOrg       = rOrg.token;
  tokenValorador = rRater.token;
  tokenValorado  = rRated.token;
  tokenExtra     = rExtra.token;
});

beforeEach(async () => {
  await sequelize.query(
    'TRUNCATE TABLE notifications, ratings, inscriptions, events RESTART IDENTITY CASCADE'
  );
  // Resetear campos desnormalizados del User que se actualizan al crear valoraciones
  await sequelize.query('UPDATE users SET rating_promedio = 0, total_valoraciones = 0');
});

// ─── Helper: crea el escenario mínimo para que una valoración sea válida ──────
// Evento finalizado + inscripciones con asistio=true para ambos usuarios.
async function setupFinalizadoConAsistencia() {
  const ev = await createEvent(organizador.id, { estado: 'finalizado' });
  await createInscription(valorador.id, ev.id, { asistio: true });
  await createInscription(valorado.id,  ev.id, { asistio: true });
  return ev;
}

function validRatingBody(valoradoId, eventoId, overrides = {}) {
  return {
    valorado_id: valoradoId,
    evento_id:   eventoId,
    puntuacion:  4,
    comentario:  'Buen jugador, muy colaborativo',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/ratings (crear valoración)', () => {
  it('un usuario que asistió puede valorar a otro participante que también asistió → 201', async () => {
    const ev = await setupFinalizadoConAsistencia();

    const res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id));

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Valoración enviada correctamente');
    expect(res.body.rating).toHaveProperty('id');
    expect(res.body.rating.puntuacion).toBe(4);
    expect(res.body.rating.valorador_id).toBe(valorador.id);
    expect(res.body.rating.valorado_id).toBe(valorado.id);
  });

  it('tras la valoración se recalcula y persiste el rating_promedio del valorado', async () => {
    const ev = await setupFinalizadoConAsistencia();

    await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id, { puntuacion: 5 }));

    const userActualizado = await User.findByPk(valorado.id);
    expect(parseFloat(userActualizado.rating_promedio)).toBe(5);
    expect(userActualizado.total_valoraciones).toBe(1);
  });

  it('devuelve 403 si el valorador NO tiene confirmada su asistencia (asistio != true)', async () => {
    const ev = await createEvent(organizador.id, { estado: 'finalizado' });
    // valorador inscrito pero asistio=null (no asistió)
    await createInscription(valorador.id, ev.id, { asistio: null });
    await createInscription(valorado.id,  ev.id, { asistio: true });

    const res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id));

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('DID_NOT_ATTEND');
  });

  it('devuelve 403 si el valorador no tiene ninguna inscripción en el evento', async () => {
    const ev = await createEvent(organizador.id, { estado: 'finalizado' });
    await createInscription(valorado.id, ev.id, { asistio: true });
    // valorador NO inscrito

    const res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id));

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('DID_NOT_ATTEND');
  });

  // El controlador devuelve 409 (no 400) cuando el evento no está finalizado.
  it('devuelve 409 si el evento no está en estado finalizado', async () => {
    const ev = await createEvent(organizador.id, { estado: 'abierto' });
    await createInscription(valorador.id, ev.id, { asistio: true });
    await createInscription(valorado.id,  ev.id, { asistio: true });

    const res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id));

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EVENT_NOT_FINISHED');
  });

  it('devuelve 409 si el valorador ya valoró al mismo usuario en el mismo evento', async () => {
    const ev = await setupFinalizadoConAsistencia();

    // Primera valoración
    await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id));

    // Segunda valoración (duplicada)
    const res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id));

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('RATING_ALREADY_EXISTS');
  });

  it('devuelve 400 si un usuario intenta valorarse a sí mismo', async () => {
    const ev = await setupFinalizadoConAsistencia();

    const res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorador.id, ev.id)); // valorado = el propio valorador

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SELF_RATING');
  });

  it('devuelve 400 si la puntuación es 0 (mínimo es 1)', async () => {
    const ev = await setupFinalizadoConAsistencia();

    const res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id, { puntuacion: 0 }));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('devuelve 400 si la puntuación es 6 (máximo es 5)', async () => {
    const ev = await setupFinalizadoConAsistencia();

    const res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id, { puntuacion: 6 }));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('devuelve 401 si no se proporciona token de autenticación', async () => {
    const ev = await setupFinalizadoConAsistencia();

    const res = await request(app)
      .post('/api/ratings')
      .send(validRatingBody(valorado.id, ev.id));

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/users/:userId/ratings (valoraciones recibidas por un usuario)', () => {
  it('devuelve 200 con la lista de valoraciones, total y rating_promedio', async () => {
    const ev = await setupFinalizadoConAsistencia();
    await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id, { puntuacion: 3 }));

    const res = await request(app).get(`/api/users/${valorado.id}/ratings`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('rating_promedio');
    expect(res.body).toHaveProperty('ratings');
    expect(Array.isArray(res.body.ratings)).toBe(true);
    expect(res.body.total).toBe(1);
  });

  it('cada valoración incluye los datos del valorador y del evento', async () => {
    const ev = await setupFinalizadoConAsistencia();
    await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id));

    const res = await request(app).get(`/api/users/${valorado.id}/ratings`);

    expect(res.status).toBe(200);
    const rating = res.body.ratings[0];
    expect(rating).toHaveProperty('valorador');
    expect(rating).toHaveProperty('evento');
    expect(rating.valorador.id).toBe(valorador.id);
  });

  it('el rating_promedio se actualiza correctamente tras recibir una valoración', async () => {
    const ev = await setupFinalizadoConAsistencia();
    await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id, { puntuacion: 5 }));

    const res = await request(app).get(`/api/users/${valorado.id}/ratings`);

    expect(res.status).toBe(200);
    expect(parseFloat(res.body.rating_promedio)).toBe(5);
  });

  it('un usuario sin valoraciones devuelve array vacío y media 0', async () => {
    const res = await request(app).get(`/api/users/${valorado.id}/ratings`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.ratings).toHaveLength(0);
    expect(parseFloat(res.body.rating_promedio)).toBe(0);
  });

  it('devuelve 404 si el usuario no existe', async () => {
    const res = await request(app)
      .get('/api/users/00000000-0000-0000-0000-000000000000/ratings');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/ratings/event/:eventId (valoraciones de un evento)', () => {
  it('devuelve 200 con la lista de valoraciones del evento', async () => {
    const ev = await setupFinalizadoConAsistencia();
    await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id, { puntuacion: 4 }));

    const res = await request(app).get(`/api/ratings/event/${ev.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('ratings');
    expect(res.body.total).toBe(1);
    expect(Array.isArray(res.body.ratings)).toBe(true);
  });

  it('cada valoración incluye valorador y valorado embebidos', async () => {
    const ev = await setupFinalizadoConAsistencia();
    await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${tokenValorador}`)
      .send(validRatingBody(valorado.id, ev.id));

    const res = await request(app).get(`/api/ratings/event/${ev.id}`);

    expect(res.status).toBe(200);
    const r = res.body.ratings[0];
    expect(r).toHaveProperty('valorador');
    expect(r).toHaveProperty('valorado');
  });

  it('devuelve total 0 para un evento sin valoraciones', async () => {
    const ev = await createEvent(organizador.id, { estado: 'finalizado' });

    const res = await request(app).get(`/api/ratings/event/${ev.id}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.ratings).toHaveLength(0);
  });
});

// Total: 17 casos de test cubiertos
//   POST /api/ratings              →  9 casos
//   GET  /api/users/:id/ratings    →  5 casos
//   GET  /api/ratings/event/:id    →  3 casos
