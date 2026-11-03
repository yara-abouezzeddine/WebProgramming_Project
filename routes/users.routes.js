
const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');

// API 1: GET all users
router.get('/', usersController.getAllUsers);

// API 2: GET user by ID
router.get('/:id', usersController.getUserById);

// API 3: POST - Create a new user
router.post('/', usersController.createUser);
module.exports = router;
