const express = require('express');
const router = express.Router();

const ClassesController = require('../controllers/classes.controllers');
const { getAllClasses, getClassesByID, AddAClass, UpdateAClass,DeleteAClass } = ClassesController;
//sconst { getAllClasses, AddAClass } = require('../controllers/classes.controllers');

// Mounted at /class in app.js
router.get('/', getAllClasses);
router.post('/', AddAClass);
router.get('/:id', getClassesByID);
router.patch('/:id', UpdateAClass);
router.delete('/:id', DeleteAClass);

module.exports = router;