
// Define the express router and import the necessary controller functions for handling trainer-related routes.
//  The router will handle GET requests to retrieve all trainers,
//  GET requests to retrieve a specific trainer by ID, 
// and POST requests to create a new trainer.
//  Finally, the router is exported for use in the main application.
const express = require('express');

const router = express.Router();


const {
    getAllTrainers,
    getTrainerById,
    createTrainer
} = require('../controllers/trainers.controller');

router.get('/', getAllTrainers);

router.get('/:id', getTrainerById);

router.post('/', createTrainer);

module.exports = router;