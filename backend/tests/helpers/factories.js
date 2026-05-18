'use strict';

const request = require('supertest');
const { User, Event, Inscription } = require('../../src/models');

async function createUser(overrides = {}) {
  return User.create({
    nombre:             'Test',
    apellidos:          'User',
    email:              `test_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
    password_hash:      'Test1234!',
    nivel:              'intermedio',
    deportes_favoritos: [],
    ...overrides,
  });
}

async function createEvent(organizadorId, overrides = {}) {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return Event.create({
    organizador_id:   organizadorId,
    titulo:           'Evento de prueba',
    descripcion:      'Descripción del evento de prueba para tests.',
    deporte:          'futbol',
    direccion:        'Calle de prueba, Murcia',
    ubicacion_lat:    37.99,
    ubicacion_lng:    -1.10,
    fecha_hora:       futureDate,
    duracion_minutos: 60,
    aforo_maximo:     10,
    aforo_actual:     0,
    nivel_requerido:  'intermedio',
    estado:           'abierto',
    ...overrides,
  });
}

async function createInscription(usuarioId, eventoId, overrides = {}) {
  return Inscription.create({
    usuario_id: usuarioId,
    evento_id:  eventoId,
    estado:     'confirmed',
    ...overrides,
  });
}

async function loginUser(app, email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body;
}

module.exports = { createUser, createEvent, createInscription, loginUser };
