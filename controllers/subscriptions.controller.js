const pool = require('../db/connection');

// Allowed values for subscription.status (change these if your table uses other words)
const VALID_STATUSES = ['active', 'expired', 'cancelled'];

// Same ID check style used in users.controller.js: positive integers only
const isValidId = (value) => /^[1-9]\d*$/.test(String(value));

// Accepts YYYY-MM-DD and rejects impossible dates like 2026-02-31
const isValidDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + 'T00:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === value;
};

// Shared SELECT so every endpoint returns subscriptions in the same shape
const SUBSCRIPTION_SELECT = `
    SELECT s.subscription_id, s.user_id, u.first_name, u.last_name,
           s.plan_id, p.plan_name, p.price,
           s.start_date, s.end_date, s.status
    FROM subscription s
    JOIN users u ON u.user_id = s.user_id
    JOIN membership_plan p ON p.plan_id = s.plan_id
`;

// API 11: POST - Create a subscription
// Start date = today, end date = today + plan duration (in months), status = active
// TODO (auth): once login/JWT exists, take user_id from the token for members
const createSubscription = async (req, res) => {
    try {
        const { user_id, plan_id } = req.body;

        if (!isValidId(user_id) || !isValidId(plan_id)) {
            return res.status(400).json({
                message: 'user_id and plan_id are required and must be valid IDs'
            });
        }

        const user = await pool.query(
            'SELECT user_id FROM users WHERE user_id = $1',
            [user_id]
        );
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const plan = await pool.query(
            'SELECT plan_id, duration_months FROM membership_plan WHERE plan_id = $1',
            [plan_id]
        );
        if (plan.rows.length === 0) {
            return res.status(404).json({ message: 'Membership plan not found' });
        }

        // A member should not hold two running subscriptions at once
        const active = await pool.query(
            `SELECT subscription_id FROM subscription
             WHERE user_id = $1 AND status = 'active' AND end_date >= CURRENT_DATE`,
            [user_id]
        );
        if (active.rows.length > 0) {
            return res.status(409).json({
                message: 'User already has an active subscription'
            });
        }

        const result = await pool.query(
            `INSERT INTO subscription (user_id, plan_id, start_date, end_date, status)
             VALUES ($1, $2, CURRENT_DATE,
                     (CURRENT_DATE + make_interval(months => $3::int))::date, 'active')
             RETURNING *`,
            [user_id, plan_id, plan.rows[0].duration_months]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error creating subscription'
        });
    }
};

// API 12: GET all subscriptions
// Optional filters: ?user_id=3  (member's own subscriptions)  ?status=active
// TODO (auth): admins see everything, members are forced to their own user_id
const getAllSubscriptions = async (req, res) => {
    try {
      
        const { user_id, status } = req.query;
        const conditions = [];
        const params = [];

        if (user_id !== undefined) {
            if (!isValidId(user_id)) {
                return res.status(400).json({ message: 'Invalid user_id filter' });
            }
            params.push(user_id);
            conditions.push(`s.user_id = $${params.length}`);
        }

        if (status !== undefined) {
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({
                    message: `status must be one of: ${VALID_STATUSES.join(', ')}`
                });
            }
            params.push(status);
            conditions.push(`s.status = $${params.length}`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await pool.query(
            `${SUBSCRIPTION_SELECT} ${where} ORDER BY s.subscription_id`,
            params
        );

        res.json(result.rows);
        

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error fetching subscriptions'
        });
    }
};

// API 13: GET subscription by ID
// TODO (auth): members may only view their own subscription
const getSubscriptionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ message: 'Invalid subscription ID' });
        }

        const result = await pool.query(
            `${SUBSCRIPTION_SELECT} WHERE s.subscription_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error fetching subscription'
        });
    }
};

// API 14: PUT - Update subscription status or dates (admin)
// Send any of: status, start_date, end_date. Fields not sent keep their value.
// TODO (auth): admin only
const updateSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, start_date, end_date } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({ message: 'Invalid subscription ID' });
        }

        if (status === undefined && start_date === undefined && end_date === undefined) {
            return res.status(400).json({
                message: 'Provide at least one of: status, start_date, end_date'
            });
        }

        if (status !== undefined && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                message: `status must be one of: ${VALID_STATUSES.join(', ')}`
            });
        }

        if (start_date !== undefined && !isValidDate(start_date)) {
            return res.status(400).json({ message: 'start_date must be YYYY-MM-DD' });
        }

        if (end_date !== undefined && !isValidDate(end_date)) {
            return res.status(400).json({ message: 'end_date must be YYYY-MM-DD' });
        }

        // COALESCE keeps the old value when the client did not send that field
        const result = await pool.query(
            `UPDATE subscription
             SET status     = COALESCE($1, status),
                 start_date = COALESCE($2::date, start_date),
                 end_date   = COALESCE($3::date, end_date)
             WHERE subscription_id = $4
             RETURNING *`,
            [status ?? null, start_date ?? null, end_date ?? null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        // 23514 = CHECK violation (only fires if your table has a CHECK on the dates)
        if (error.code === '23514') {
            return res.status(400).json({
                message: 'end_date cannot be before start_date'
            });
        }

        console.error(error);

        res.status(500).json({
            message: 'Error updating subscription'
        });
    }
};

module.exports = {
    createSubscription,
    getAllSubscriptions,
    getSubscriptionById,
    updateSubscription
};