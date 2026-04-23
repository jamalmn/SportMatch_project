'use strict';

const bcrypt = require('bcryptjs');
const { sequelize, User, Event, Inscription, Rating, Notification } = require('../models');

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// ─── Datos ──────────────────────────────────────────────────────────────────


function buildEvents(users) {
  const [juan, maria, carlos] = users;

  return [
    // ── Fútbol ──────────────────────────────────────────────────────────────
    {
      organizador_id: juan.id,
      titulo: 'Partido de fútbol 7 en La Condomina',
      descripcion: 'Partido amistoso de fútbol 7. Todos los niveles bienvenidos, buen rollo garantizado.',
      deporte: 'futbol',
      direccion: 'Campo La Condomina, Murcia',
      ubicacion_lat: rand(37.97, 38.01),
      ubicacion_lng: rand(-1.13, -1.07),
      fecha_hora: daysFromNow(2),
      duracion_minutos: 90,
      aforo_maximo: 14,
      nivel_requerido: 'principiante',
      estado: 'abierto',
    },
    {
      organizador_id: maria.id,
      titulo: 'Fútbol sala en el polideportivo La Flota',
      descripcion: 'Partidos de fútbol sala de nivel intermedio. Zapatillas de interior obligatorias.',
      deporte: 'futbol',
      direccion: 'Polideportivo La Flota, Murcia',
      ubicacion_lat: rand(37.97, 38.01),
      ubicacion_lng: rand(-1.13, -1.07),
      fecha_hora: daysFromNow(5),
      duracion_minutos: 60,
      aforo_maximo: 10,
      nivel_requerido: 'intermedio',
      estado: 'abierto',
    },
    // ── Baloncesto ──────────────────────────────────────────────────────────
    {
      organizador_id: carlos.id,
      titulo: '3x3 baloncesto en Barrio del Carmen',
      descripcion: 'Torneo informal de baloncesto 3x3. Trae agua y ganas de jugar.',
      deporte: 'baloncesto',
      direccion: 'Pistas Barrio del Carmen, Murcia',
      ubicacion_lat: rand(37.97, 38.01),
      ubicacion_lng: rand(-1.13, -1.07),
      fecha_hora: daysFromNow(3),
      duracion_minutos: 120,
      aforo_maximo: 12,
      nivel_requerido: 'intermedio',
      estado: 'abierto',
    },
    {
      organizador_id: juan.id,
      titulo: 'Baloncesto 5x5 nivel avanzado',
      descripcion: 'Partido serio de baloncesto. Se busca gente con buen manejo del balón y táctica.',
      deporte: 'baloncesto',
      direccion: 'Pabellón La Fica, Murcia',
      ubicacion_lat: rand(37.97, 38.01),
      ubicacion_lng: rand(-1.13, -1.07),
      fecha_hora: daysFromNow(8),
      duracion_minutos: 90,
      aforo_maximo: 10,
      nivel_requerido: 'avanzado',
      estado: 'abierto',
    },
    // ── Pádel ───────────────────────────────────────────────────────────────
    {
      organizador_id: maria.id,
      titulo: 'Pádel mixto para principiantes',
      descripcion: 'Jornada de pádel para quienes se están iniciando. Pistas cubiertas y raquetas disponibles.',
      deporte: 'padel',
      direccion: 'Club Pádel Murcia Centro, Murcia',
      ubicacion_lat: rand(37.97, 38.01),
      ubicacion_lng: rand(-1.13, -1.07),
      fecha_hora: daysFromNow(4),
      duracion_minutos: 90,
      aforo_maximo: 4,
      nivel_requerido: 'principiante',
      estado: 'abierto',
    },
    {
      organizador_id: carlos.id,
      titulo: 'Pádel competitivo — cuadro de dobles',
      descripcion: 'Cuadro de dobles de pádel. Nivel medio-alto. Se hacen grupos según nivel.',
      deporte: 'padel',
      direccion: 'Pádel Indoor Murcia, Avda. Juan Carlos I',
      ubicacion_lat: rand(37.97, 38.01),
      ubicacion_lng: rand(-1.13, -1.07),
      fecha_hora: daysFromNow(12),
      duracion_minutos: 180,
      aforo_maximo: 8,
      nivel_requerido: 'intermedio',
      estado: 'abierto',
    },
    // ── Voleibol ────────────────────────────────────────────────────────────
    {
      organizador_id: juan.id,
      titulo: 'Voleibol playa en La Manga',
      descripcion: 'Tarde de voley playa en La Manga del Mar Menor. Nivel abierto a todos.',
      deporte: 'voleibol',
      direccion: 'Playa La Manga, Murcia',
      ubicacion_lat: rand(37.63, 37.70),
      ubicacion_lng: rand(-0.74, -0.70),
      fecha_hora: daysFromNow(6),
      duracion_minutos: 120,
      aforo_maximo: 12,
      nivel_requerido: 'principiante',
      estado: 'abierto',
    },
    {
      organizador_id: maria.id,
      titulo: 'Voleibol indoor — entrenamiento técnico',
      descripcion: 'Sesión de voleibol indoor con enfoque en técnica y recepción. Nivel intermedio.',
      deporte: 'voleibol',
      direccion: 'Polideportivo Infante, Murcia',
      ubicacion_lat: rand(37.97, 38.01),
      ubicacion_lng: rand(-1.13, -1.07),
      fecha_hora: daysFromNow(15),
      duracion_minutos: 90,
      aforo_maximo: 12,
      nivel_requerido: 'intermedio',
      estado: 'abierto',
    },
    // ── Running ─────────────────────────────────────────────────────────────
    {
      organizador_id: carlos.id,
      titulo: 'Carrera matinal por el Malecón',
      descripcion: 'Salida en grupo por el paseo del Malecón. Ritmo suave, apto para todos los niveles.',
      deporte: 'running',
      direccion: 'Paseo del Malecón, Murcia (junto al Teatro Romea)',
      ubicacion_lat: rand(37.97, 38.01),
      ubicacion_lng: rand(-1.13, -1.07),
      fecha_hora: daysFromNow(1),
      duracion_minutos: 60,
      aforo_maximo: 20,
      nivel_requerido: 'principiante',
      estado: 'abierto',
    },
    {
      organizador_id: juan.id,
      titulo: 'Running de fondo — 15 km por la huerta',
      descripcion: 'Ruta de 15 km por la huerta murciana. Ritmo medio-alto, para runners habituales.',
      deporte: 'running',
      direccion: 'Salida desde Jardín de Floridablanca, Murcia',
      ubicacion_lat: rand(37.97, 38.01),
      ubicacion_lng: rand(-1.13, -1.07),
      fecha_hora: daysFromNow(10),
      duracion_minutos: 90,
      aforo_maximo: 15,
      nivel_requerido: 'intermedio',
      estado: 'abierto',
    },
    // ── Ciclismo ────────────────────────────────────────────────────────────
    {
      organizador_id: maria.id,
      titulo: 'Ruta ciclista MTB Sierra de Carrascoy',
      descripcion: 'Ruta de montaña por la Sierra de Carrascoy. Bici de montaña recomendada. Nivel avanzado.',
      deporte: 'ciclismo',
      direccion: 'Aparcamiento Sierra de Carrascoy, Murcia',
      ubicacion_lat: rand(37.92, 37.96),
      ubicacion_lng: rand(-1.10, -1.06),
      fecha_hora: daysFromNow(9),
      duracion_minutos: 180,
      aforo_maximo: 10,
      nivel_requerido: 'avanzado',
      estado: 'abierto',
    },
    {
      organizador_id: carlos.id,
      titulo: 'Ciclismo urbano — rodada tranquila por Murcia',
      descripcion: 'Paseo en bici por el centro de Murcia y sus alrededores. Velocidad moderada, apto para todos.',
      deporte: 'ciclismo',
      direccion: 'Plaza Circular, Murcia',
      ubicacion_lat: rand(37.97, 38.01),
      ubicacion_lng: rand(-1.13, -1.07),
      fecha_hora: daysFromNow(20),
      duracion_minutos: 120,
      aforo_maximo: 16,
      nivel_requerido: 'principiante',
      estado: 'abierto',
    },
  ];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    await sequelize.authenticate();

    // 1. Limpiar en orden (FK safe)
    await sequelize.query(
      'TRUNCATE TABLE notifications, ratings, inscriptions, events, users RESTART IDENTITY CASCADE'
    );

    // 2. Usuarios — contraseñas pre-hasheadas para garantizar integridad
    const passwordHash = await bcrypt.hash('Test1234!', 10);
    const USERS_DATA = [
      {
        nombre: 'Juan',
        apellidos: 'García López',
        email: 'juan@sportmatch.com',
        password_hash: passwordHash,
        ubicacion: 'Murcia',
        nivel: 'intermedio',
        deportes_favoritos: ['futbol', 'baloncesto', 'running'],
      },
      {
        nombre: 'María',
        apellidos: 'Martínez Sánchez',
        email: 'maria@sportmatch.com',
        password_hash: passwordHash,
        ubicacion: 'Murcia',
        nivel: 'principiante',
        deportes_favoritos: ['padel', 'voleibol', 'natacion'],
      },
      {
        nombre: 'Carlos',
        apellidos: 'Fernández Ruiz',
        email: 'carlos@sportmatch.com',
        password_hash: passwordHash,
        ubicacion: 'Murcia',
        nivel: 'avanzado',
        deportes_favoritos: ['ciclismo', 'baloncesto', 'running'],
      },
    ];

    const users = await User.bulkCreate(USERS_DATA, { validate: true, hooks: false });
    const [juan, maria, carlos] = users;
    console.log(`✓ ${users.length} usuarios creados`);

    // 3. Eventos
    const eventsData = buildEvents(users);
    const events = await Event.bulkCreate(eventsData, { validate: true });
    console.log(`✓ ${events.length} eventos creados`);

    // 4. Inscripciones (inscritos + actualiza aforo_actual)
    //    Se inscriben participantes en eventos de otros organizadores
    const inscriptionsData = [
      // María y Carlos en eventos de Juan
      { evento_id: events[0].id,  usuario_id: maria.id,  estado: 'confirmed' },
      { evento_id: events[0].id,  usuario_id: carlos.id, estado: 'confirmed' },
      { evento_id: events[3].id,  usuario_id: maria.id,  estado: 'confirmed' },
      { evento_id: events[9].id,  usuario_id: carlos.id, estado: 'confirmed' },
      // Juan y Carlos en eventos de María
      { evento_id: events[1].id,  usuario_id: juan.id,   estado: 'confirmed' },
      { evento_id: events[4].id,  usuario_id: carlos.id, estado: 'confirmed' },
      { evento_id: events[7].id,  usuario_id: juan.id,   estado: 'confirmed' },
      // Juan y María en eventos de Carlos
      { evento_id: events[2].id,  usuario_id: juan.id,   estado: 'confirmed' },
      { evento_id: events[2].id,  usuario_id: maria.id,  estado: 'confirmed' },
      { evento_id: events[8].id,  usuario_id: juan.id,   estado: 'confirmed' },
      { evento_id: events[8].id,  usuario_id: maria.id,  estado: 'confirmed' },
      { evento_id: events[10].id, usuario_id: juan.id,   estado: 'confirmed' },
    ];

    await Inscription.bulkCreate(inscriptionsData, { validate: true });

    // Actualizar aforo_actual por evento
    const aforoMap = {};
    for (const ins of inscriptionsData) {
      aforoMap[ins.evento_id] = (aforoMap[ins.evento_id] ?? 0) + 1;
    }
    await Promise.all(
      Object.entries(aforoMap).map(([eventoId, count]) =>
        Event.update({ aforo_actual: count }, { where: { id: eventoId } })
      )
    );

    console.log(`✓ ${inscriptionsData.length} inscripciones creadas`);
    console.log('✓ Seed completado');
  } catch (err) {
    console.error('✗ Error durante el seed:', err.message);
    if (err.errors) err.errors.forEach((e) => console.error('  ·', e.message));
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
