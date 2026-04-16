'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const { verifyToken }                      = require('../middlewares/authMiddleware');
const { createRating, getEventRatings }    = require('../controllers/ratingController');

const router = Router();

const createRatingValidators = [
  body('valorado_id')
    .isUUID().withMessage('El ID del usuario valorado no es válido'),
  body('evento_id')
    .isUUID().withMessage('El ID del evento no es válido'),
  body('puntuacion')
    .isInt({ min: 1, max: 5 }).withMessage('La puntuación debe ser un entero entre 1 y 5'),
  body('comentario')
    .optional()
    .isLength({ max: 500 }).withMessage('El comentario no puede superar los 500 caracteres')
    .trim(),
];

router.post('/',               verifyToken, createRatingValidators, createRating);
router.get('/event/:eventId',  getEventRatings);

module.exports = router;
