-- =============================================================
--  SportMatch — Script de creación de base de datos
--  PostgreSQL 14+
--  Ejecutar sobre una base de datos vacía:
--    psql -U postgres -d sportmatch -f sportmatch_schema.sql
-- =============================================================

-- Activar extensión para UUIDs (disponible por defecto en PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================
--  TIPOS ENUM
-- =============================================================

CREATE TYPE nivel_deportivo AS ENUM (
    'principiante',
    'intermedio',
    'avanzado'
);

CREATE TYPE estado_evento AS ENUM (
    'abierto',
    'completo',
    'cancelado',
    'finalizado'
);

CREATE TYPE estado_inscripcion AS ENUM (
    'confirmed',
    'waiting',
    'cancelled'
);

CREATE TYPE tipo_notificacion AS ENUM (
    'inscripcion_confirmada',
    'inscripcion_cancelada',
    'lista_espera_promovido',
    'evento_actualizado',
    'evento_cancelado',
    'recordatorio_24h',
    'nueva_valoracion'
);


-- =============================================================
--  TABLA: users
--  Almacena los datos de registro y perfil de cada usuario.
-- =============================================================

CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255)    NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,
    nombre              VARCHAR(100)    NOT NULL,
    apellidos           VARCHAR(100)    NOT NULL,
    bio                 TEXT,
    foto_perfil         VARCHAR(500),
    ubicacion           VARCHAR(200),
    ubicacion_lat       DECIMAL(9,6)    CHECK (ubicacion_lat  BETWEEN -90  AND 90),
    ubicacion_lng       DECIMAL(9,6)    CHECK (ubicacion_lng  BETWEEN -180 AND 180),
    deportes_favoritos  TEXT[]          NOT NULL DEFAULT '{}',
    nivel               nivel_deportivo NOT NULL DEFAULT 'principiante',
    rating_promedio     DECIMAL(3,2)    NOT NULL DEFAULT 0.00
                            CHECK (rating_promedio BETWEEN 0 AND 5),
    total_valoraciones  INTEGER         NOT NULL DEFAULT 0
                            CHECK (total_valoraciones >= 0),
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email)
);

COMMENT ON TABLE  users                     IS 'Usuarios registrados en la plataforma';
COMMENT ON COLUMN users.deportes_favoritos  IS 'Lista de deportes de interés del usuario';
COMMENT ON COLUMN users.rating_promedio     IS 'Media desnormalizada, se actualiza con cada valoración';
COMMENT ON COLUMN users.activo              IS 'FALSE actúa como soft delete sin borrar el registro';


-- =============================================================
--  TABLA: events
--  Eventos deportivos creados por los usuarios organizadores.
-- =============================================================

CREATE TABLE events (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organizador_id   UUID            NOT NULL
                         REFERENCES users(id) ON DELETE RESTRICT,
    titulo           VARCHAR(200)    NOT NULL,
    descripcion      TEXT            NOT NULL,
    deporte          VARCHAR(100)    NOT NULL,
    ubicacion_lat    DECIMAL(9,6)    NOT NULL
                         CHECK (ubicacion_lat  BETWEEN -90  AND 90),
    ubicacion_lng    DECIMAL(9,6)    NOT NULL
                         CHECK (ubicacion_lng  BETWEEN -180 AND 180),
    direccion        VARCHAR(300)    NOT NULL,
    fecha_hora       TIMESTAMPTZ     NOT NULL,
    duracion_minutos INTEGER         NOT NULL DEFAULT 60
                         CHECK (duracion_minutos > 0),
    aforo_maximo     INTEGER         NOT NULL
                         CHECK (aforo_maximo >= 2),
    aforo_actual     INTEGER         NOT NULL DEFAULT 0
                         CHECK (aforo_actual >= 0),
    nivel_requerido  nivel_deportivo NOT NULL DEFAULT 'principiante',
    estado           estado_evento   NOT NULL DEFAULT 'abierto',
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ,

    CONSTRAINT chk_aforo_actual_max
        CHECK (aforo_actual <= aforo_maximo),
    CONSTRAINT chk_fecha_futura
        CHECK (fecha_hora > created_at)
);

COMMENT ON TABLE  events               IS 'Eventos deportivos amateur publicados en la plataforma';
COMMENT ON COLUMN events.aforo_actual  IS 'Desnormalizado: se actualiza al confirmar/cancelar inscripciones';
COMMENT ON COLUMN events.deleted_at    IS 'Soft delete: registro visible solo si es NULL';
COMMENT ON COLUMN events.organizador_id IS 'RESTRICT impide borrar un usuario con eventos activos';


-- =============================================================
--  TABLA: inscriptions
--  Registra la participación de usuarios en eventos.
-- =============================================================

CREATE TABLE inscriptions (
    id                UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id         UUID               NOT NULL
                          REFERENCES events(id) ON DELETE CASCADE,
    usuario_id        UUID               NOT NULL
                          REFERENCES users(id) ON DELETE CASCADE,
    estado            estado_inscripcion NOT NULL DEFAULT 'confirmed',
    posicion_espera   INTEGER            CHECK (posicion_espera > 0),
    asistio           BOOLEAN,
    fecha_inscripcion TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_inscripcion_usuario_evento
        UNIQUE (evento_id, usuario_id),

    -- Solo los registros en 'waiting' pueden tener posición de espera
    CONSTRAINT chk_posicion_espera_coherente
        CHECK (
            (estado = 'waiting'  AND posicion_espera IS NOT NULL) OR
            (estado != 'waiting' AND posicion_espera IS NULL)
        )
);

COMMENT ON TABLE  inscriptions                  IS 'Inscripciones de usuarios a eventos (confirmadas y en espera)';
COMMENT ON COLUMN inscriptions.posicion_espera  IS 'Orden en lista de espera; NULL si estado != waiting';
COMMENT ON COLUMN inscriptions.asistio          IS 'NULL hasta que finalice el evento; TRUE/FALSE tras confirmación post-evento';


-- =============================================================
--  TABLA: ratings
--  Valoraciones entre usuarios tras la celebración de un evento.
-- =============================================================

CREATE TABLE ratings (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    valorado_id  UUID        NOT NULL
                     REFERENCES users(id) ON DELETE CASCADE,
    valorador_id UUID        NOT NULL
                     REFERENCES users(id) ON DELETE CASCADE,
    evento_id    UUID        NOT NULL
                     REFERENCES events(id) ON DELETE CASCADE,
    puntuacion   SMALLINT    NOT NULL
                     CHECK (puntuacion BETWEEN 1 AND 5),
    comentario   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un usuario solo puede valorar a otro una vez por evento
    CONSTRAINT uq_rating_unico
        UNIQUE (valorado_id, valorador_id, evento_id),

    -- Nadie puede valorarse a sí mismo
    CONSTRAINT chk_no_autovaloracion
        CHECK (valorado_id != valorador_id)
);

COMMENT ON TABLE  ratings              IS 'Valoraciones entre participantes de un mismo evento';
COMMENT ON COLUMN ratings.valorado_id  IS 'Usuario que recibe la puntuación';
COMMENT ON COLUMN ratings.valorador_id IS 'Usuario que emite la puntuación';
COMMENT ON COLUMN ratings.puntuacion   IS 'Escala 1-5 estrellas';


-- =============================================================
--  TABLA: notifications
--  Notificaciones generadas por el sistema para cada usuario.
-- =============================================================

CREATE TABLE notifications (
    id         UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID              NOT NULL
                   REFERENCES users(id) ON DELETE CASCADE,
    evento_id  UUID
                   REFERENCES events(id) ON DELETE SET NULL,
    tipo       tipo_notificacion NOT NULL,
    titulo     VARCHAR(200)      NOT NULL,
    mensaje    TEXT              NOT NULL,
    leida      BOOLEAN           NOT NULL DEFAULT FALSE,
    leida_at   TIMESTAMPTZ,
    created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

    -- Si leida = TRUE debe existir fecha de lectura, y viceversa
    CONSTRAINT chk_leida_coherente
        CHECK (
            (leida = TRUE  AND leida_at IS NOT NULL) OR
            (leida = FALSE AND leida_at IS NULL)
        )
);

COMMENT ON TABLE  notifications           IS 'Notificaciones del sistema para cada usuario';
COMMENT ON COLUMN notifications.evento_id IS 'Nullable: algunas notificaciones no están ligadas a un evento';
COMMENT ON COLUMN notifications.leida_at  IS 'Momento exacto en que el usuario marcó la notificación como leída';


-- =============================================================
--  ÍNDICES
-- =============================================================

-- ---- users ----
CREATE UNIQUE INDEX idx_users_email
    ON users(email);

CREATE INDEX idx_users_nivel
    ON users(nivel);

-- Búsqueda de usuarios por proximidad geográfica
CREATE INDEX idx_users_ubicacion
    ON users(ubicacion_lat, ubicacion_lng)
    WHERE ubicacion_lat IS NOT NULL;


-- ---- events ----

-- Búsqueda por deporte + fecha (consulta más frecuente)
CREATE INDEX idx_events_deporte_fecha
    ON events(deporte, fecha_hora)
    WHERE deleted_at IS NULL;

-- Búsqueda por proximidad geográfica
CREATE INDEX idx_events_ubicacion
    ON events(ubicacion_lat, ubicacion_lng)
    WHERE deleted_at IS NULL;

-- Listado por estado + fecha (dashboard, eventos abiertos)
CREATE INDEX idx_events_estado_fecha
    ON events(estado, fecha_hora)
    WHERE deleted_at IS NULL;

-- Eventos de un organizador concreto
CREATE INDEX idx_events_organizador
    ON events(organizador_id)
    WHERE deleted_at IS NULL;

-- Filtro por nivel requerido
CREATE INDEX idx_events_nivel
    ON events(nivel_requerido)
    WHERE deleted_at IS NULL;


-- ---- inscriptions ----

-- Mis inscripciones (dashboard del usuario)
CREATE INDEX idx_inscriptions_usuario
    ON inscriptions(usuario_id, estado);

-- Participantes de un evento (vista de detalle)
CREATE INDEX idx_inscriptions_evento
    ON inscriptions(evento_id, estado);

-- Primer usuario en lista de espera (para promoción automática)
CREATE INDEX idx_inscriptions_espera
    ON inscriptions(evento_id, posicion_espera)
    WHERE estado = 'waiting';


-- ---- ratings ----

-- Valoraciones recibidas por un usuario (perfil público)
CREATE INDEX idx_ratings_valorado
    ON ratings(valorado_id, created_at DESC);

-- Valoraciones emitidas por un usuario
CREATE INDEX idx_ratings_valorador
    ON ratings(valorador_id);

-- Valoraciones de un evento concreto
CREATE INDEX idx_ratings_evento
    ON ratings(evento_id);


-- ---- notifications ----

-- Notificaciones no leídas (badge en el navbar)
CREATE INDEX idx_notifications_no_leidas
    ON notifications(usuario_id, created_at DESC)
    WHERE leida = FALSE;

-- Todas las notificaciones de un usuario (página de notificaciones)
CREATE INDEX idx_notifications_usuario
    ON notifications(usuario_id, created_at DESC);


-- =============================================================
--  DATOS DE PRUEBA
--  Insertar en orden respetando las foreign keys.
-- =============================================================

-- ---- Usuarios ----
INSERT INTO users (id, email, password_hash, nombre, apellidos, ubicacion, ubicacion_lat, ubicacion_lng, deportes_favoritos, nivel)
VALUES
    ('a1000000-0000-0000-0000-000000000001',
     'carlos@example.com',
     '$2b$10$hashedpassword1',
     'Carlos', 'García López',
     'Murcia', 37.9922, -1.1307,
     ARRAY['fútbol', 'baloncesto'],
     'intermedio'),

    ('a1000000-0000-0000-0000-000000000002',
     'laura@example.com',
     '$2b$10$hashedpassword2',
     'Laura', 'Martínez Ruiz',
     'Murcia', 37.9841, -1.1284,
     ARRAY['pádel', 'tenis'],
     'avanzado'),

    ('a1000000-0000-0000-0000-000000000003',
     'miguel@example.com',
     '$2b$10$hashedpassword3',
     'Miguel', 'Sánchez Torres',
     'Murcia', 37.9910, -1.1350,
     ARRAY['fútbol'],
     'principiante');


-- ---- Eventos ----
INSERT INTO events (id, organizador_id, titulo, descripcion, deporte, ubicacion_lat, ubicacion_lng, direccion, fecha_hora, duracion_minutos, aforo_maximo, aforo_actual, nivel_requerido, estado)
VALUES
    ('b2000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000001',
     'Partido de fútbol 7 — Sábado tarde',
     'Partido amistoso en el polideportivo municipal. Llevad petos.',
     'fútbol',
     37.9930, -1.1290,
     'Polideportivo La Flota, Murcia',
     NOW() + INTERVAL '3 days',
     90, 14, 1,
     'principiante', 'abierto'),

    ('b2000000-0000-0000-0000-000000000002',
     'a1000000-0000-0000-0000-000000000002',
     'Dobles de pádel — nivel medio-alto',
     'Buscamos dos jugadores para completar dos parejas. Pista cubierta.',
     'pádel',
     37.9855, -1.1310,
     'Club de Pádel Murcia Centro',
     NOW() + INTERVAL '5 days',
     60, 4, 2,
     'intermedio', 'abierto');


-- ---- Inscripciones ----
-- Carlos organiza fútbol, también se inscribe como participante
INSERT INTO inscriptions (evento_id, usuario_id, estado, asistio)
VALUES
    ('b2000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000001',
     'confirmed', NULL),

-- Miguel se apunta al partido de fútbol
    ('b2000000-0000-0000-0000-000000000001',
     'a1000000-0000-0000-0000-000000000003',
     'confirmed', NULL),

-- Carlos se apunta al pádel de Laura
    ('b2000000-0000-0000-0000-000000000002',
     'a1000000-0000-0000-0000-000000000001',
     'confirmed', NULL),

-- Laura (organizadora) se incluye en su propio evento de pádel
    ('b2000000-0000-0000-0000-000000000002',
     'a1000000-0000-0000-0000-000000000002',
     'confirmed', NULL);


-- ---- Notificaciones ----
INSERT INTO notifications (usuario_id, evento_id, tipo, titulo, mensaje)
VALUES
    ('a1000000-0000-0000-0000-000000000003',
     'b2000000-0000-0000-0000-000000000001',
     'inscripcion_confirmada',
     'Inscripción confirmada',
     'Tu inscripción al evento "Partido de fútbol 7 — Sábado tarde" ha sido confirmada.'),

    ('a1000000-0000-0000-0000-000000000001',
     'b2000000-0000-0000-0000-000000000002',
     'inscripcion_confirmada',
     'Inscripción confirmada',
     'Tu inscripción al evento "Dobles de pádel — nivel medio-alto" ha sido confirmada.');


-- =============================================================
--  VERIFICACIÓN RÁPIDA
--  Ejecuta estas consultas para comprobar que todo está en orden.
-- =============================================================

-- Usuarios creados
SELECT id, email, nombre, nivel, rating_promedio FROM users;

-- Eventos con nombre del organizador
SELECT e.titulo, e.deporte, e.fecha_hora, e.aforo_maximo, e.aforo_actual,
       u.nombre || ' ' || u.apellidos AS organizador
FROM events e
JOIN users u ON u.id = e.organizador_id
WHERE e.deleted_at IS NULL;

-- Inscripciones con datos del usuario y el evento
SELECT i.estado, u.nombre, e.titulo
FROM inscriptions i
JOIN users  u ON u.id = i.usuario_id
JOIN events e ON e.id = i.evento_id
ORDER BY e.titulo, u.nombre;

-- Notificaciones pendientes de leer
SELECT u.nombre, n.tipo, n.titulo, n.leida
FROM notifications n
JOIN users u ON u.id = n.usuario_id
WHERE n.leida = FALSE;
