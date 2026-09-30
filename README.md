# SportMatch 🏃‍♂️⚽🎾

[![CI](https://github.com/jamalmn/SportMatch_project/actions/workflows/ci.yml/badge.svg)](https://github.com/jamalmn/SportMatch_project/actions/workflows/ci.yml)

> Plataforma web para la organización y participación en eventos deportivos amateur.

**SportMatch** cubre el hueco que dejan herramientas como WhatsApp, Meetup o Playtomic para el deporte amateur: permite crear y gestionar eventos deportivos, inscribirse con lista de espera automática, buscar actividades por proximidad geográfica y valorar a otros participantes tras el evento.

---

## Funcionalidades principales

- Registro y autenticación con JWT y refresh token
- Creación y gestión de eventos deportivos
- Sistema de inscripciones con lista de espera automática
- Búsqueda y filtrado por deporte, nivel, fecha y proximidad geográfica (Haversine)
- Geolocalización con mapa interactivo (Leaflet + OpenStreetMap)
- Notificaciones in-app y por email
- Sistema de valoraciones entre participantes tras el evento
- Dashboard personalizado y perfil de usuario
- Diseño responsive (móvil, tablet y escritorio)

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL + Sequelize ORM |
| Autenticación | JWT + Refresh Token |
| Mapas | Leaflet + OpenStreetMap |
| Email | Nodemailer |
| Contenedores (dev) | Docker + docker-compose |

---

## Estructura del repositorio

```
SportMatch_project/
├── backend/          # API REST (Node.js + Express + Sequelize)
│   ├── src/          # config, controllers, middlewares, models, routes, services
│   ├── tests/        # Jest + Supertest (contra PostgreSQL real)
│   ├── database/     # esquema SQL de producción
│   └── Dockerfile
├── frontend/         # SPA (React + Vite + Tailwind)
│   ├── src/          # components, context, hooks, pages, services, tests
│   ├── Dockerfile    # build multi-stage → nginx
├── .github/workflows/ci.yml   # tests + build en cada push/PR
└── docker-compose.yml         # PostgreSQL + API + frontend
```

---

## Instalación y puesta en marcha

### Opción A — Docker (recomendada)

Requisitos: Docker y Docker Compose.

```bash
git clone https://github.com/jamalmn/SportMatch_project.git
cd SportMatch_project
docker compose up --build
```

Levanta PostgreSQL, la API y el frontend (con valores por defecto de desarrollo).
Para cambiar credenciales o secretos, copia `backend/.env.example` a `.env` en la raíz antes de arrancar.

| Servicio    | URL                         |
|-------------|-----------------------------|
| Frontend    | http://localhost:5173       |
| Backend API | http://localhost:5000/api   |
| PostgreSQL  | localhost:5455              |

### Opción B — Manual (sin Docker)

Requisitos: Node.js 20+ y PostgreSQL en local.

```bash
# 1. Variables de entorno (el backend lee el .env de la RAÍZ del repo)
cp backend/.env.example .env          # rellena DB_*, JWT_* y FRONTEND_URL
cp frontend/.env.example frontend/.env
#    frontend/.env → VITE_API_URL=http://localhost:5000   (sin /api al final)

# 2. Backend
cd backend && npm install && npm run dev

# 3. Frontend (otra terminal)
cd frontend && npm install && npm run dev
```

Datos de ejemplo (opcional): `npm run seed` dentro de `backend/`.

### Tests

```bash
# Backend: necesita PostgreSQL con una base de datos vacía llamada sportmatch_test
cd backend && npm test

# Frontend
cd frontend && npx vitest run
```

El mismo flujo se ejecuta en GitHub Actions en cada push y pull request.

---

## Decisiones técnicas

- **Lista de espera sin overbooking.** Inscribirse y cancelar se ejecutan dentro de transacciones con `SELECT ... FOR UPDATE` sobre la fila del evento, de modo que dos peticiones simultáneas a la última plaza se serializan. Hay un test de concurrencia que lanza 4 inscripciones a la vez sobre un evento de aforo 2.
- **Promoción automática.** Al cancelar una plaza confirmada, el primero de la cola pasa a confirmado y la cola se reordena en la misma transacción.
- **Búsqueda por proximidad** con la fórmula de Haversine.
- **Esquema gestionado por entorno:** `sync` de Sequelize en test/desarrollo y SQL versionado (`backend/database/`) en producción.
- **Tests contra PostgreSQL real**, no contra mocks de base de datos.

---

## API REST

La API expone 24 endpoints agrupados en 6 recursos:

| Recurso | Prefijo | Descripción |
|---------|---------|-------------|
| Auth | `/api/auth` | Registro, login, refresh token |
| Usuarios | `/api/users` | Perfil, actualización |
| Eventos | `/api/events` | CRUD, búsqueda geográfica |
| Inscripciones | `/api/inscriptions` | Unirse, cancelar, lista de espera |
| Valoraciones | `/api/ratings` | Crear y consultar valoraciones |
| Notificaciones | `/api/notifications` | Listar, marcar como leída |

Las rutas están definidas en `backend/src/routes/`.

---

## Contexto académico

Proyecto desarrollado como **Trabajo de Fin de Grado (TFG)** del grado en **Ingeniería Informática en TI**.

**Autor:** Jamal Menchi

---

## Licencia

Este proyecto ha sido desarrollado con fines académicos.
