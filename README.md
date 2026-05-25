# SportMatch 🏃‍♂️⚽🎾

> Plataforma web para la organización y participación en eventos deportivos amateur.

**SportMatch** cubre el hueco que dejan herramientas como WhatsApp, Meetup o Playtomic para el deporte amateur: permite crear y gestionar eventos deportivos, inscribirse con lista de espera automática, buscar actividades por proximidad geográfica y valorar a otros participantes tras el evento.

🌐 **Producción:** [sport-match-project.vercel.app](https://sport-match-project.vercel.app)

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
| Despliegue frontend | Vercel |
| Despliegue backend | Render |
| Contenedores (dev) | Docker + docker-compose |

---

## Estructura del repositorio

```
SportMatch_project/
├── backend/          # API REST con Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── .env.example
│   └── README.md
├── frontend/         # SPA con React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   ├── vercel.json
│   └── README.md
├── docker-compose.yml
└── .gitignore
```

---

## Instalación y puesta en marcha

### Requisitos previos

- Node.js 18+
- Docker y Docker Compose
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/jamalmn/SportMatch_project.git
cd SportMatch_project
```

### 2. Variables de entorno

```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores

# Frontend
cp frontend/.env.example frontend/.env
# Editar frontend/.env con tus valores
```

Variables necesarias en `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sportmatch
DB_USER=postgres
DB_PASSWORD=tu_password

JWT_SECRET=tu_jwt_secret
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=tu_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Variables necesarias en `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Arrancar con Docker (recomendado)

```bash
docker compose up --build
```

Esto levanta PostgreSQL, el backend y el frontend automáticamente.

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Base de datos | localhost:5432 |

### 4. Arrancar manualmente (sin Docker)

```bash
# Base de datos: necesitas PostgreSQL corriendo localmente

# Backend
cd backend
npm install
npm run dev

# Frontend (nueva terminal)
cd frontend
npm install
npm run dev
```

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

Documentación completa disponible en `backend/README.md`.

---

## Despliegue en producción

El proyecto está desplegado en:

- **Frontend:** Vercel — [sport-match-project.vercel.app](https://sport-match-project.vercel.app)
- **Backend:** Render — [sportmatch-api.onrender.com](https://sportmatch-api.onrender.com)
- **Base de datos:** PostgreSQL en Render

---

## Contexto académico

Proyecto desarrollado como **Trabajo de Fin de Grado (TFG)** del grado en **Ingeniería Informática en TI**.

**Autor:** Jamal Menchi

---

## Licencia

Este proyecto ha sido desarrollado con fines académicos.
