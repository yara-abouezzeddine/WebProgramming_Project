
const pool = require('../db/connection');

// API 1: GET all users
const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, first_name, last_name,
                    email, phone, role, created_at
             FROM users`
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error fetching users'
        });
    }
};

// API 2: GET user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return res.status(400).json({
                message: 'Invalid user ID'
            });
        }

        const result = await pool.query(
            `SELECT user_id, first_name, last_name,
                    email, phone, role, created_at
             FROM users
             WHERE user_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error fetching user'
        });
    }
};

// API 3: POST - Create a new user
const createUser = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password, role } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                message: 'Required fields are missing'
            });
        }

        const bcrypt = require('bcrypt');
        const password_hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users
             (first_name, last_name, email, phone, password_hash, role)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING user_id, first_name, last_name, email, phone, role, created_at`,
            [first_name, last_name, email, phone || null, password_hash, role || 'member']
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error creating user'
        });
    }
};

module.exports = { getAllUsers, getUserById, createUser };

