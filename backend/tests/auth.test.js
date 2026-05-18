'use strict';

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../src/app');
const { User } = require('../src/models');
const { createUser } = require('./helpers');

// Payload de registro válido reutilizado en todos los suites
const VALID_USER = {
  email:     'ana@example.com',
  password:  'Segura1234!',
  nombre:    'Ana',
  apellidos: 'Pérez García',
};

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  it('debe registrar un usuario nuevo y devolver 201 con token y refreshToken', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(VALID_USER);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Usuario registrado correctamente');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(VALID_USER.email);
  });

  it('no debe incluir password_hash en el objeto user de la respuesta', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(VALID_USER);

    expect(res.status).toBe(201);
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('debe almacenar la contraseña como hash bcrypt en la base de datos', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(VALID_USER);

    expect(res.status).toBe(201);
    const userEnBD = await User.findByPk(res.body.user.id);
    expect(userEnBD.password_hash).toMatch(/^\$2b\$/);
    expect(userEnBD.password_hash).not.toBe(VALID_USER.password);
  });

  it('debe devolver 409 si el email ya está registrado', async () => {
    await createUser({ email: VALID_USER.email, password_hash: VALID_USER.password });

    const res = await request(app)
      .post('/api/auth/register')
      .send(VALID_USER);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe(true);
    expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('debe devolver 400 si el email tiene formato inválido', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_USER, email: 'no-es-un-email' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('debe devolver 400 si la contraseña tiene menos de 8 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_USER, password: 'corta' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('debe devolver 400 si falta el campo nombre', async () => {
    const { nombre, ...sinNombre } = VALID_USER;
    const res = await request(app)
      .post('/api/auth/register')
      .send(sinNombre);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('debe devolver 400 si falta el campo email', async () => {
    const { email, ...sinEmail } = VALID_USER;
    const res = await request(app)
      .post('/api/auth/register')
      .send(sinEmail);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('debe devolver 400 si falta el campo password', async () => {
    const { password, ...sinPassword } = VALID_USER;
    const res = await request(app)
      .post('/api/auth/register')
      .send(sinPassword);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('debe devolver 400 si falta el campo apellidos', async () => {
    const { apellidos, ...sinApellidos } = VALID_USER;
    const res = await request(app)
      .post('/api/auth/register')
      .send(sinApellidos);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  it('debe devolver 200 con token y refreshToken cuando las credenciales son correctas', async () => {
    await createUser({ email: VALID_USER.email, password_hash: VALID_USER.password });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Inicio de sesión correcto');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
  });

  it('el accessToken devuelto debe ser un JWT con 3 partes separadas por punto', async () => {
    await createUser({ email: VALID_USER.email, password_hash: VALID_USER.password });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.token.split('.')).toHaveLength(3);
  });

  it('no debe incluir password_hash en el objeto user de la respuesta', async () => {
    await createUser({ email: VALID_USER.email, password_hash: VALID_USER.password });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('debe devolver 401 si el email no está registrado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@example.com', password: VALID_USER.password });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('debe devolver 401 si la contraseña es incorrecta', async () => {
    await createUser({ email: VALID_USER.email, password_hash: VALID_USER.password });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: 'ContraseñaWrong99!' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('debe devolver 400 si el body está vacío (email y password ausentes)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/refresh', () => {
  let validRefreshToken;

  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
    const res = await request(app)
      .post('/api/auth/register')
      .send(VALID_USER);
    validRefreshToken = res.body.refreshToken;
  });

  it('debe devolver 200 con nuevos accessToken y refreshToken cuando el token es válido', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: validRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Token renovado correctamente');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('los nuevos tokens deben tener formato JWT válido (3 partes)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: validRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.token.split('.')).toHaveLength(3);
    expect(res.body.refreshToken.split('.')).toHaveLength(3);
  });

  it('debe devolver 401 si el refreshToken ha sido manipulado', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: validRefreshToken + 'manipulado' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('debe devolver 401 si el refreshToken está expirado', async () => {
    // Crea un token con exp en el pasado usando el secreto real
    const expiredToken = jwt.sign(
      { id: 'cualquier-id', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.REFRESH_TOKEN_SECRET
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: expiredToken });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_REFRESH_TOKEN');
  });

  // El controlador refreshToken no llama a validationResult(req), por lo que
  // un body sin refreshToken alcanza el if(!incomingToken) del controlador → 401,
  // no el 400 que produciría el validador de express-validator si se procesara.
  it('debe devolver 401 si el body no contiene refreshToken', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('MISSING_REFRESH_TOKEN');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
  let validToken;

  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
    const res = await request(app)
      .post('/api/auth/register')
      .send(VALID_USER);
    validToken = res.body.token;
  });

  it('debe devolver 200 cuando se proporciona un token de acceso válido', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Sesión cerrada correctamente');
  });

  it('debe devolver 401 si no se proporciona ningún token', async () => {
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Middleware verifyToken — rutas protegidas', () => {
  let validToken;

  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
    const res = await request(app)
      .post('/api/auth/register')
      .send(VALID_USER);
    validToken = res.body.token;
  });

  it('GET /api/users/me sin cabecera Authorization debe devolver 401', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/users/me con token sintácticamente inválido debe devolver 401', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer token.falsificado.invalido');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/users/me con token firmado con secreto incorrecto debe devolver 401', async () => {
    const tokenFalso = jwt.sign({ id: 'fake-id' }, 'secreto-incorrecto');

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${tokenFalso}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/users/me con token válido debe devolver 200 con los datos del usuario', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password_hash');
  });
});

// Total: 27 casos de test cubiertos
//   POST /api/auth/register  → 10 casos
//   POST /api/auth/login     →  6 casos
//   POST /api/auth/refresh   →  5 casos
//   POST /api/auth/logout    →  2 casos
//   verifyToken middleware   →  4 casos
