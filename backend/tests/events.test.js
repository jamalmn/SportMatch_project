'use strict';

const request = require('supertest');
const app  = require('../src/app');
const { sequelize, Event } = require('../src/models');
const { createUser, createEvent, loginUser } = require('./helpers');

// Evita llamadas de red a Ethereal en tests (deleteEvent y otros envían emails)
jest.mock('../src/services/emailService', () => ({
  sendEventCancelledEmail:       jest.fn().mockResolvedValue({}),
  sendInscriptionConfirmedEmail: jest.fn().mockResolvedValue({}),
  sendInscriptionCancelledEmail: jest.fn().mockResolvedValue({}),
  sendWaitlistPromotedEmail:     jest.fn().mockResolvedValue({}),
  sendWelcomeEmail:              jest.fn().mockResolvedValue({}),
}));

// ─── Payload de evento válido para POST ───────────────────────────────────────
function validEventBody(overrides = {}) {
  return {
    titulo:           'Partido de fútbol de prueba',
    descripcion:      'Descripción suficientemente larga para superar el mínimo de diez caracteres.',
    deporte:          'futbol',
    fecha_hora:       new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    duracion_minutos: 90,
    direccion:        'Calle Mayor 1, Murcia',
    ubicacion_lat:    37.99,
    ubicacion_lng:    -1.10,
    aforo_maximo:     10,
    nivel_requerido:  'intermedio',
    ...overrides,
  };
}

// ─── Fixtures compartidos: se recrean antes de cada test ─────────────────────
let organizador, participante, tokenOrg, tokenPart;
let evento1, evento2, evento3;

beforeEach(async () => {
  await sequelize.query(
    'TRUNCATE TABLE notifications, ratings, inscriptions, events, users RESTART IDENTITY CASCADE'
  );

  organizador  = await createUser({ email: 'org@test.com',  password_hash: 'Test1234!', nombre: 'Org',  apellidos: 'Test' });
  participante = await createUser({ email: 'part@test.com', password_hash: 'Test1234!', nombre: 'Part', apellidos: 'Test' });

  const resOrg  = await loginUser(app, 'org@test.com',  'Test1234!');
  const resPart = await loginUser(app, 'part@test.com', 'Test1234!');
  tokenOrg  = resOrg.token;
  tokenPart = resPart.token;

  // 3 eventos con distintos deportes, niveles y fechas para probar filtros
  evento1 = await createEvent(organizador.id, {
    titulo:          'Fútbol principiante',
    deporte:         'futbol',
    nivel_requerido: 'principiante',
    fecha_hora:      new Date(Date.now() +  2 * 24 * 60 * 60 * 1000),
  });
  evento2 = await createEvent(organizador.id, {
    titulo:          'Pádel intermedio',
    deporte:         'padel',
    nivel_requerido: 'intermedio',
    fecha_hora:      new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  });
  evento3 = await createEvent(organizador.id, {
    titulo:          'Baloncesto avanzado',
    deporte:         'baloncesto',
    nivel_requerido: 'avanzado',
    fecha_hora:      new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/events (listado público)', () => {
  it('devuelve 200 con estructura paginada { total, page, limit, events }', async () => {
    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.total).toBe(3);
  });

  it('cada evento incluye plazas_disponibles y el organizador embebido', async () => {
    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    const ev = res.body.events[0];
    expect(ev).toHaveProperty('plazas_disponibles');
    expect(ev).toHaveProperty('organizador');
    expect(ev.organizador).toHaveProperty('id');
    expect(ev.organizador).toHaveProperty('nombre');
  });

  it('filtro ?deporte=futbol devuelve solo eventos de fútbol', async () => {
    const res = await request(app).get('/api/events?deporte=futbol');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.events[0].deporte).toBe('futbol');
  });

  it('filtro ?nivel=principiante devuelve solo eventos de ese nivel', async () => {
    const res = await request(app).get('/api/events?nivel=principiante');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.events[0].nivel_requerido).toBe('principiante');
  });

  it('filtro fecha_desde + fecha_hasta acota el rango: solo devuelve evento1 (en 2 días)', async () => {
    const desde = new Date(Date.now() +  1 * 24 * 60 * 60 * 1000).toISOString(); // mañana
    const hasta = new Date(Date.now() +  5 * 24 * 60 * 60 * 1000).toISOString(); // en 5 días

    const res = await request(app)
      .get(`/api/events?fecha_desde=${desde}&fecha_hasta=${hasta}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.events[0].deporte).toBe('futbol'); // evento1
  });

  it('paginación: page=1&limit=2 devuelve máximo 2 eventos aunque haya 3', async () => {
    const res = await request(app).get('/api/events?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.events).toHaveLength(2);
    expect(res.body.limit).toBe(2);
  });

  it('es pública: funciona correctamente sin cabecera Authorization', async () => {
    const res = await request(app).get('/api/events');
    // Sin token → igualmente devuelve 200
    expect(res.status).toBe(200);
  });

  it('excluye eventos con estado cancelado y finalizado del listado por defecto', async () => {
    // Actualizar directo en BD: estado=cancelado sin deleted_at (ambos siguen visibles en la tabla
    // pero el filtro estado NOT IN ('cancelado','finalizado') los excluye del listado)
    await evento1.update({ estado: 'cancelado' });
    await evento2.update({ estado: 'finalizado' });

    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1); // solo evento3 (abierto)
    expect(res.body.events[0].estado).toBe('abierto');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/events/:eventId', () => {
  it('devuelve 200 con el evento, organizador, participantes, plazas_disponibles y total_en_espera', async () => {
    const res = await request(app).get(`/api/events/${evento1.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(evento1.id);
    expect(res.body).toHaveProperty('organizador');
    expect(Array.isArray(res.body.participantes)).toBe(true);
    expect(res.body).toHaveProperty('plazas_disponibles');
    expect(res.body).toHaveProperty('total_en_espera');
  });

  it('el organizador embebido incluye los campos públicos esperados', async () => {
    const res = await request(app).get(`/api/events/${evento1.id}`);

    expect(res.status).toBe(200);
    expect(res.body.organizador.id).toBe(organizador.id);
    expect(res.body.organizador).toHaveProperty('nombre');
    expect(res.body.organizador).toHaveProperty('rating_promedio');
    expect(res.body.organizador).not.toHaveProperty('password_hash');
  });

  it('devuelve 404 si el eventId es un UUID válido pero no existe', async () => {
    const idInexistente = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).get(`/api/events/${idInexistente}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('EVENT_NOT_FOUND');
  });

  it('devuelve error (no 200) con un eventId de formato no UUID', async () => {
    // PostgreSQL lanza error de sintaxis para UUIDs inválidos → errorHandler devuelve 500
    const res = await request(app).get('/api/events/esto-no-es-un-uuid');

    expect(res.status).not.toBe(200);
    expect(res.body.error).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/events (crear evento)', () => {
  it('crea el evento correctamente y devuelve 201 con el evento creado', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenOrg}`)
      .send(validEventBody());

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Evento creado correctamente');
    expect(res.body.event).toHaveProperty('id');
    expect(res.body.event.titulo).toBe('Partido de fútbol de prueba');
    expect(res.body.event.estado).toBe('abierto');
    expect(res.body.event.aforo_actual).toBe(0);
  });

  it('el organizador_id del evento creado coincide con el id del usuario autenticado', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenOrg}`)
      .send(validEventBody());

    expect(res.status).toBe(201);
    expect(res.body.event.organizador_id).toBe(organizador.id);
  });

  it('devuelve 401 si no se proporciona token de autenticación', async () => {
    const res = await request(app)
      .post('/api/events')
      .send(validEventBody());

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('devuelve 400 si la fecha_hora está en el pasado', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenOrg}`)
      .send(validEventBody({
        fecha_hora: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      }));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('devuelve 400 si aforo_maximo es 1 (mínimo permitido es 2)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenOrg}`)
      .send(validEventBody({ aforo_maximo: 1 }));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('devuelve 400 si falta el campo título', async () => {
    const { titulo, ...sinTitulo } = validEventBody();
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenOrg}`)
      .send(sinTitulo);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('devuelve 400 si falta el campo deporte', async () => {
    const { deporte, ...sinDeporte } = validEventBody();
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenOrg}`)
      .send(sinDeporte);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('devuelve 400 si falta el campo fecha_hora', async () => {
    const { fecha_hora, ...sinFecha } = validEventBody();
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${tokenOrg}`)
      .send(sinFecha);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/events/:eventId (editar evento)', () => {
  it('el organizador puede editar el título de su evento y recibe 200', async () => {
    const res = await request(app)
      .put(`/api/events/${evento1.id}`)
      .set('Authorization', `Bearer ${tokenOrg}`)
      .send({ titulo: 'Título actualizado correctamente' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Evento actualizado correctamente');
    expect(res.body.event).toHaveProperty('id');
  });

  it('devuelve 403 si un usuario diferente al organizador intenta editar', async () => {
    const res = await request(app)
      .put(`/api/events/${evento1.id}`)
      .set('Authorization', `Bearer ${tokenPart}`)
      .send({ titulo: 'Intento de edición no autorizado' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('devuelve 401 si no se proporciona token de autenticación', async () => {
    const res = await request(app)
      .put(`/api/events/${evento1.id}`)
      .send({ titulo: 'Sin token' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('devuelve 404 si el eventId no corresponde a ningún evento existente', async () => {
    const idInexistente = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .put(`/api/events/${idInexistente}`)
      .set('Authorization', `Bearer ${tokenOrg}`)
      .send({ titulo: 'Evento que no existe' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('EVENT_NOT_FOUND');
  });

  it('devuelve 400 si se intenta actualizar fecha_hora con una fecha pasada', async () => {
    // El controlador (no el validador de ruta) comprueba esta regla manualmente
    const res = await request(app)
      .put(`/api/events/${evento1.id}`)
      .set('Authorization', `Bearer ${tokenOrg}`)
      .send({ fecha_hora: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/events/:eventId (cancelar evento)', () => {
  it('el organizador puede cancelar su evento y recibe 200', async () => {
    const res = await request(app)
      .delete(`/api/events/${evento1.id}`)
      .set('Authorization', `Bearer ${tokenOrg}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Evento cancelado y eliminado correctamente');
  });

  it('tras la cancelación el evento ya no es accesible vía GET /api/events/:id', async () => {
    await request(app)
      .delete(`/api/events/${evento1.id}`)
      .set('Authorization', `Bearer ${tokenOrg}`);

    // El defaultScope de Event filtra deleted_at: null → el evento soft-deleted devuelve 404
    const getRes = await request(app).get(`/api/events/${evento1.id}`);
    expect(getRes.status).toBe(404);
  });

  it('devuelve 403 si un usuario diferente al organizador intenta cancelar', async () => {
    const res = await request(app)
      .delete(`/api/events/${evento1.id}`)
      .set('Authorization', `Bearer ${tokenPart}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('devuelve 401 si no se proporciona token de autenticación', async () => {
    const res = await request(app)
      .delete(`/api/events/${evento1.id}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('devuelve 409 si el evento ya tiene estado cancelado (sin deleted_at)', async () => {
    // Simula un evento en estado cancelado sin deleted_at para cubrir el código path 409.
    // (deleteEvent verifica req.event.estado antes de actualizar; isOrganizer requiere
    //  deleted_at: null para encontrarlo, por eso no se usa la ruta DELETE para el primer cancel.)
    await evento1.update({ estado: 'cancelado' });

    const res = await request(app)
      .delete(`/api/events/${evento1.id}`)
      .set('Authorization', `Bearer ${tokenOrg}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EVENT_ALREADY_CANCELLED');
  });
});

// Total: 30 casos de test cubiertos
//   GET  /api/events           →  8 casos
//   GET  /api/events/:eventId  →  4 casos
//   POST /api/events           →  8 casos
//   PUT  /api/events/:eventId  →  5 casos
//   DELETE /api/events/:id     →  5 casos
