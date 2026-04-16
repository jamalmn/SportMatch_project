'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const { register, login, logout } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = Router();

const registerValidators = [
  body('email')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio')
    .trim(),
  body('apellidos')
    .notEmpty().withMessage('Los apellidos son obligatorios')
    .trim(),
];

const loginValidators = [
  body('email')
    .isEmail().withMessage('El email no es válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
];

router.post('/register', registerValidators, register);
router.post('/login',    loginValidators,    login);
router.post('/logout',   verifyToken,        logout);

module.exports = router;
