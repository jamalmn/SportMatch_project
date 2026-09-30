'use strict';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');
const { createUser, createEvent, loginUser } = require('./helpers');

jest.mock('../src/services/emailService', () => ({
  sendEventCancelledEmail:       jest.fn().mockResolvedValue({}),
  sendInscriptionConfirmedEmail: jest.fn().mockResolvedValue({}),
  sendInscriptionCancelledEmail: jest.fn().mockResolvedValue({}),
  sendWaitlistPromotedEmail:     jest.fn().mockResolvedValue({}),
  sendWelcomeEmail:              jest.fn().mockResolvedValue({}),
}));

// ─── Usuarios y tokens: se crean UNA sola vez ─────────────────────────────────
// beforeEach solo limpia eventos e inscripciones, no usuarios, para reutilizar tokens.

let organizador, usuarioA, usuarioB, usuarioC, usuarioD;
let tokenOrg, tokenA, tokenB, tokenC, tokenD;

beforeAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE notifications, ratings, inscriptions, events, users RESTART IDENTITY CASCADE'
  );

  organizador = await createUser({ email: 'org@ins.test',   password_hash: 'Test1234!', nombre: 'Org', apellidos: 'Test' });
  usuarioA    = await createUser({ email: 'a@ins.test',     password_hash: 'Test1234!', nombre: 'A',   apellidos: 'Test' });
  usuarioB    = await createUser({ email: 'b@ins.test',     password_hash: 'Test1234!', nombre: 'B',   apellidos: 'Test' });
  usuarioC    = await createUser({ email: 'c@ins.test',     password_hash: 'Test1234!', nombre: 'C',   apellidos: 'Test' });
  usuarioD    = await createUser({ email: 'd@ins.test',     password_hash: 'Test1234!', nombre: 'D',   apellidos: 'Test' });

  const [rOrg, rA, rB, rC, rD] = await Promise.all([
    loginUser(app, 'org@ins.test', 'Test1234!'),
    loginUser(app, 'a@ins.test',   'Test1234!'),
    loginUser(app, 'b@ins.test',   'Test1234!'),
    loginUser(app, 'c@ins.test',   'Test1234!'),
    loginUser(app, 'd@ins.test',   'Test1234!'),
  ]);
  tokenOrg = rOrg.token;
  tokenA   = rA.token;
  tokenB   = rB.token;
  tokenC   = rC.token;
  tokenD   = rD.token;
});

beforeEach(async () => {
  // Solo limpia eventos, inscripciones y notificaciones — los usuarios se conservan
  await sequelize.query(
    'TRUNCATE TABLE notifications, ratings, inscriptions, events RESTART IDENTITY CASCADE'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/events/:eventId/inscriptions (inscribirse en un evento)', () => {
  it('debe inscribir al usuario como confirmado cuando hay plazas disponibles → 201', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });

    const res = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(201);
    expect(res.body.inscription.estado).toBe('confirmed');
    expect(res.body.inscription.usuario_id).toBe(usuarioA.id);
    expect(res.body.message).toBe('Inscripción confirmada correctamente');
  });

  it('debe incrementar el aforo_actual del evento tras una inscripción confirmada', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });

    await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    const evRes = await request(app).get(`/api/events/${ev.id}`);
    expect(evRes.body.aforo_actual).toBe(1);
    expect(evRes.body.plazas_disponibles).toBe(4);
  });

  it('debe marcar el evento como completo cuando se ocupa la última plaza', async () => {
    // aforo_maximo=2: A ocupa la 1ª plaza, B ocupa la 2ª → evento pasa a completo
    const ev = await createEvent(organizador.id, { aforo_maximo: 2 });

    await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);
    await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenB}`);

    const evRes = await request(app).get(`/api/events/${ev.id}`);
    expect(evRes.body.estado).toBe('completo');
    expect(evRes.body.aforo_actual).toBe(2);
  });

  it('debe poner al usuario en lista de espera cuando el evento está completo → 201', async () => {
    // Evento ya lleno (aforo_actual = aforo_maximo)
    const ev = await createEvent(organizador.id, { aforo_maximo: 2, aforo_actual: 2, estado: 'completo' });

    const res = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(201);
    expect(res.body.inscription.estado).toBe('waiting');
    expect(res.body.inscription.posicion_espera).toBe(1);
    expect(res.body.message).toContain('lista de espera');
  });

  it('debe asignar posiciones de espera consecutivas a varios usuarios en cola', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 2, aforo_actual: 2, estado: 'completo' });

    const resC = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenC}`);
    const resD = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenD}`);

    expect(resC.body.inscription.posicion_espera).toBe(1);
    expect(resD.body.inscription.posicion_espera).toBe(2);
  });

  it('debe devolver 409 si el usuario ya tiene una inscripción activa en ese evento', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });

    await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    const res = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ALREADY_INSCRIBED');
  });

  it('debe devolver 403 si el organizador intenta inscribirse en su propio evento', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });

    const res = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenOrg}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ORGANIZER_CANNOT_JOIN');
  });

  it('debe devolver 401 si no se proporciona token de autenticación', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });

    const res = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('debe devolver 404 si el evento no existe', async () => {
    const res = await request(app)
      .post('/api/events/00000000-0000-0000-0000-000000000000/inscriptions')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('EVENT_NOT_FOUND');
  });

  it('debe devolver 409 si el evento está cancelado', async () => {
    const ev = await createEvent(organizador.id, { estado: 'cancelado' });

    const res = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EVENT_NOT_OPEN');
  });

  it('debe devolver 409 si el evento está finalizado', async () => {
    const ev = await createEvent(organizador.id, { estado: 'finalizado' });

    const res = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EVENT_NOT_OPEN');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/events/:eventId/inscriptions (cancelar inscripción)', () => {
  it('debe cancelar una inscripción confirmada y devolver 200', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });
    await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    const res = await request(app)
      .delete(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Inscripción cancelada correctamente');
  });

  it('debe devolver el id del usuario promovido cuando había alguien en lista de espera', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 2 });

    // A y B llenan el evento; C queda en espera
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenA}`);
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenB}`);
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenC}`);

    // A cancela → C debe ser promovido
    const res = await request(app)
      .delete(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.promoted_user).toBe(usuarioC.id);
  });

  it('la inscripción del usuario promovido debe pasar a estado confirmed en la BD', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 2 });

    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenA}`);
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenB}`);
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenC}`);

    await request(app)
      .delete(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    // Verificar estado de C vía endpoint de inscripciones
    const insRes = await request(app)
      .get(`/api/events/${ev.id}/inscriptions?estado=confirmed`)
      .set('Authorization', `Bearer ${tokenOrg}`);

    const inscripcionC = insRes.body.inscriptions.find(i => i.usuario_id === usuarioC.id);
    expect(inscripcionC).toBeDefined();
    expect(inscripcionC.estado).toBe('confirmed');
  });

  it('debe cancelar inscripción en lista de espera sin promover a nadie → promoted_user null', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 2, aforo_actual: 2, estado: 'completo' });

    // C va a la lista de espera
    await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenC}`);

    // C cancela desde la lista de espera (no había confirmados suyos que liberar plaza)
    const res = await request(app)
      .delete(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenC}`);

    expect(res.status).toBe(200);
    expect(res.body.promoted_user).toBeNull();
  });

  it('debe devolver 404 si el usuario no tiene ninguna inscripción activa en ese evento', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });

    const res = await request(app)
      .delete(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('INSCRIPTION_NOT_FOUND');
  });

  it('debe devolver 401 si no se proporciona token de autenticación', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });

    const res = await request(app)
      .delete(`/api/events/${ev.id}/inscriptions`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Flujo completo — lógica de lista de espera (test de integración)', () => {
  it('debe gestionar correctamente el ciclo completo: 2 confirmados, 2 en espera, promoción y reordenación', async () => {
    // Evento con aforo máximo 2
    const ev = await createEvent(organizador.id, { aforo_maximo: 2 });

    // ── Paso 1-2: A y B se inscriben → confirmed (llenan el evento) ──────────
    const resA = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);
    const resB = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resA.body.inscription.estado).toBe('confirmed');
    expect(resB.body.inscription.estado).toBe('confirmed');

    // El evento debe estar ahora completo
    const evCompleto = await request(app).get(`/api/events/${ev.id}`);
    expect(evCompleto.body.estado).toBe('completo');

    // ── Paso 3-4: C y D se inscriben → waiting ───────────────────────────────
    const resC = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenC}`);
    const resD = await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenD}`);

    expect(resC.body.inscription.estado).toBe('waiting');
    expect(resD.body.inscription.estado).toBe('waiting');
    expect(resC.body.inscription.posicion_espera).toBe(1);
    expect(resD.body.inscription.posicion_espera).toBe(2);

    // ── Paso 5: A cancela su inscripción confirmada ───────────────────────────
    const cancelRes = await request(app)
      .delete(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(cancelRes.status).toBe(200);
    // El usuario promovido debe ser C (posición 1 en la cola)
    expect(cancelRes.body.promoted_user).toBe(usuarioC.id);

    // ── Paso 6: Verificar estado final de las inscripciones ───────────────────
    const insRes = await request(app)
      .get(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenOrg}`);

    expect(insRes.status).toBe(200);
    // Solo B y C deben estar confirmados
    expect(insRes.body.confirmados).toBe(2);
    // Solo D sigue en espera
    expect(insRes.body.en_espera).toBe(1);

    // ── Paso 7: C ahora está confirmado ──────────────────────────────────────
    const insC = insRes.body.inscriptions.find(i => i.usuario_id === usuarioC.id);
    expect(insC).toBeDefined();
    expect(insC.estado).toBe('confirmed');
    expect(insC.posicion_espera).toBeNull();

    // ── Paso 8: D sigue en espera y ha pasado a posición 1 ───────────────────
    const insD = insRes.body.inscriptions.find(i => i.usuario_id === usuarioD.id);
    expect(insD).toBeDefined();
    expect(insD.estado).toBe('waiting');
    expect(insD.posicion_espera).toBe(1); // reordenado de 2 → 1

    // ── Paso 9: El aforo del evento refleja 2/2 ocupados ─────────────────────
    const evFinal = await request(app).get(`/api/events/${ev.id}`);
    expect(evFinal.body.aforo_actual).toBe(2);
    expect(evFinal.body.aforo_maximo).toBe(2);
    expect(evFinal.body.plazas_disponibles).toBe(0);
    expect(evFinal.body.total_en_espera).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/events/:eventId/inscriptions (ver participantes de un evento)', () => {
  it('debe devolver 200 con los contadores total, confirmados y en_espera', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenA}`);
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenB}`);

    const res = await request(app)
      .get(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenOrg}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('confirmados');
    expect(res.body).toHaveProperty('en_espera');
    expect(Array.isArray(res.body.inscriptions)).toBe(true);
    expect(res.body.confirmados).toBe(2);
  });

  it('?estado=confirmed devuelve únicamente inscripciones confirmadas (excluye waiting)', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 2 });
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenA}`);
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenB}`);
    // El evento está completo; C va a la lista de espera
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenC}`);

    const res = await request(app)
      .get(`/api/events/${ev.id}/inscriptions?estado=confirmed`)
      .set('Authorization', `Bearer ${tokenOrg}`);

    expect(res.status).toBe(200);
    expect(res.body.inscriptions.every(i => i.estado === 'confirmed')).toBe(true);
    const usuariosDevueltos = res.body.inscriptions.map(i => i.usuario_id);
    expect(usuariosDevueltos).not.toContain(usuarioC.id);
  });

  it('?estado=waiting devuelve únicamente inscripciones en lista de espera', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 2 });
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenA}`);
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenB}`);
    await request(app).post(`/api/events/${ev.id}/inscriptions`).set('Authorization', `Bearer ${tokenC}`);

    const res = await request(app)
      .get(`/api/events/${ev.id}/inscriptions?estado=waiting`)
      .set('Authorization', `Bearer ${tokenOrg}`);

    expect(res.status).toBe(200);
    expect(res.body.inscriptions).toHaveLength(1);
    expect(res.body.inscriptions[0].usuario_id).toBe(usuarioC.id);
    expect(res.body.inscriptions[0].posicion_espera).toBe(1);
  });

  it('debe devolver 401 si no se proporciona token de autenticación', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });

    const res = await request(app)
      .get(`/api/events/${ev.id}/inscriptions`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/users/me/inscriptions (mis inscripciones)', () => {
  it('debe devolver 200 con la lista paginada de inscripciones del usuario autenticado', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });
    await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    const res = await request(app)
      .get('/api/users/me/inscriptions')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(Array.isArray(res.body.inscriptions)).toBe(true);
    expect(res.body.total).toBe(1);
    expect(res.body.inscriptions[0].usuario_id).toBe(usuarioA.id);
  });

  it('cada inscripción incluye el evento embebido con su organizador', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 5 });
    await request(app)
      .post(`/api/events/${ev.id}/inscriptions`)
      .set('Authorization', `Bearer ${tokenA}`);

    const res = await request(app)
      .get('/api/users/me/inscriptions')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    const ins = res.body.inscriptions[0];
    expect(ins).toHaveProperty('evento');
    expect(ins.evento).toHaveProperty('id');
    expect(ins.evento).toHaveProperty('organizador');
  });

  it('debe devolver 401 si no se proporciona token de autenticación', async () => {
    const res = await request(app).get('/api/users/me/inscriptions');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

// Total: 26 casos de test cubiertos
//   POST  (inscribirse)                 → 10 casos
//   DELETE (cancelar)                   →  6 casos
//   Flujo completo lista de espera      →  1 test de integración (9 aserciones internas)
//   GET inscripciones del evento        →  4 casos
//   GET mis inscripciones               →  3 casos
//   (+ 2 casos de posiciones en cola dentro del describe POST)

// ─────────────────────────────────────────────────────────────────────────────
describe('Concurrencia — inscripciones simultáneas con el aforo casi lleno', () => {
  it('no debe superar el aforo: con aforo 2 y 4 peticiones a la vez, 2 confirmadas y 2 en espera', async () => {
    const ev = await createEvent(organizador.id, { aforo_maximo: 2 });

    const responses = await Promise.all(
      [tokenA, tokenB, tokenC, tokenD].map((token) =>
        request(app)
          .post(`/api/events/${ev.id}/inscriptions`)
          .set('Authorization', `Bearer ${token}`)
      )
    );

    responses.forEach((r) => expect(r.status).toBe(201));

    const estados = responses.map((r) => r.body.inscription.estado);
    expect(estados.filter((e) => e === 'confirmed')).toHaveLength(2);
    expect(estados.filter((e) => e === 'waiting')).toHaveLength(2);

    // Posiciones de espera únicas y correlativas (1, 2)
    const posiciones = responses
      .filter((r) => r.body.inscription.estado === 'waiting')
      .map((r) => r.body.inscription.posicion_espera)
      .sort();
    expect(posiciones).toEqual([1, 2]);

    const evFinal = await request(app).get(`/api/events/${ev.id}`);
    expect(evFinal.body.aforo_actual).toBe(2);
    expect(evFinal.body.estado).toBe('completo');
  });
});
