const express = require('express');
const router = express.Router();

const subscriptionsController = require('../controllers/subscriptions.controller');

// API 11: POST - Create a subscription
router.post('/', subscriptionsController.createSubscription);

// API 12: GET all subscriptions (optional ?user_id= & ?status=)
router.get('/', subscriptionsController.getAllSubscriptions);

// API 13: GET subscription by ID
router.get('/:id', subscriptionsController.getSubscriptionById);

// API 14: PUT - Update subscription status or dates
router.put('/:id', subscriptionsController.updateSubscription);

module.exports = router;