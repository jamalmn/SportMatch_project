'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const { verifyToken }    = require('../middlewares/authMiddleware');
const { getMe, updateMe, getMyInscriptions, getPublicProfile, getUserEvents, getUserRatings } = require('../controllers/userController');

const router = Router();

const updateMeValidators = [
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .trim(),
  body('apellidos')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
    .trim(),
  body('bio')
    .optional()
    .isLength({ max: 500 }).withMessage('La bio no puede superar los 500 caracteres')
    .trim(),
  body('ubicacion_lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('La latitud debe estar entre -90 y 90'),
  body('ubicacion_lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('La longitud debe estar entre -180 y 180'),
  body('nivel')
    .optional()
    .isIn(['principiante', 'intermedio', 'avanzado']).withMessage('Nivel no válido'),
];

router.get('/me',               verifyToken, getMe);
router.put('/me',               verifyToken, updateMeValidators, updateMe);
router.get('/me/inscriptions',  verifyToken, getMyInscriptions);

// Rutas públicas con parámetro — deben ir DESPUÉS de /me
router.get('/:userId',         getPublicProfile);
router.get('/:userId/events',  getUserEvents);
router.get('/:userId/ratings', getUserRatings);

module.exports = router;
