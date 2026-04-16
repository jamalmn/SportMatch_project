'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const { verifyToken, isOrganizer }                              = require('../middlewares/authMiddleware');
const { getEvents, createEvent, getEventById, updateEvent, deleteEvent } = require('../controllers/eventController');
const { joinEvent, leaveEvent, getEventInscriptions, markAttendance } = require('../controllers/inscriptionController');

const router = Router();

const createEventValidators = [
  body('titulo')
    .isLength({ min: 5, max: 150 }).withMessage('El título debe tener entre 5 y 150 caracteres')
    .trim(),
  body('descripcion')
    .isLength({ min: 10, max: 2000 }).withMessage('La descripción debe tener entre 10 y 2000 caracteres')
    .trim(),
  body('deporte')
    .notEmpty().withMessage('El deporte es obligatorio')
    .trim(),
  body('fecha_hora')
    .isISO8601().withMessage('La fecha debe estar en formato ISO 8601')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La fecha del evento debe ser futura');
      }
      return true;
    }),
  body('duracion_minutos')
    .isInt({ min: 15, max: 480 }).withMessage('La duración debe estar entre 15 y 480 minutos'),
  body('direccion')
    .notEmpty().withMessage('La dirección es obligatoria')
    .isLength({ max: 255 }).withMessage('La dirección no puede superar los 255 caracteres')
    .trim(),
  body('ubicacion_lat')
    .isFloat({ min: -90,  max: 90  }).withMessage('La latitud debe estar entre -90 y 90'),
  body('ubicacion_lng')
    .isFloat({ min: -180, max: 180 }).withMessage('La longitud debe estar entre -180 y 180'),
  body('aforo_maximo')
    .isInt({ min: 2, max: 500 }).withMessage('El aforo debe estar entre 2 y 500'),
  body('nivel_requerido')
    .isIn(['principiante', 'intermedio', 'avanzado']).withMessage('Nivel no válido'),
];

const updateEventValidators = [
  body('titulo')
    .optional()
    .isLength({ min: 5, max: 150 }).withMessage('El título debe tener entre 5 y 150 caracteres')
    .trim(),
  body('descripcion')
    .optional()
    .isLength({ min: 10, max: 2000 }).withMessage('La descripción debe tener entre 10 y 2000 caracteres')
    .trim(),
  body('deporte')
    .optional()
    .notEmpty().withMessage('El deporte no puede estar vacío')
    .trim(),
  body('duracion_minutos')
    .optional()
    .isInt({ min: 15, max: 480 }).withMessage('La duración debe estar entre 15 y 480 minutos'),
  body('direccion')
    .optional()
    .isLength({ min: 1, max: 255 }).withMessage('La dirección no puede superar los 255 caracteres')
    .trim(),
  body('ubicacion_lat')
    .optional()
    .isFloat({ min: -90,  max: 90  }).withMessage('La latitud debe estar entre -90 y 90'),
  body('ubicacion_lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('La longitud debe estar entre -180 y 180'),
  body('aforo_maximo')
    .optional()
    .isInt({ min: 2, max: 500 }).withMessage('El aforo debe estar entre 2 y 500'),
  body('nivel_requerido')
    .optional()
    .isIn(['principiante', 'intermedio', 'avanzado']).withMessage('Nivel no válido'),
];

router.get('/',            getEvents);
router.post('/',           verifyToken, createEventValidators,  createEvent);
router.get('/:eventId',    getEventById);
router.put('/:eventId',    verifyToken, isOrganizer, updateEventValidators, updateEvent);
router.delete('/:eventId', verifyToken, isOrganizer, deleteEvent);
router.post('/:eventId/inscriptions',   verifyToken, joinEvent);
router.delete('/:eventId/inscriptions', verifyToken, leaveEvent);
router.get('/:eventId/inscriptions',    verifyToken, isOrganizer, getEventInscriptions);
router.patch('/:eventId/inscriptions/:inscriptionId/attendance', verifyToken, isOrganizer, markAttendance);

module.exports = router;
