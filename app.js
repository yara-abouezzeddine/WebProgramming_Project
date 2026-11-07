
const express = require('express');
const pool = require('./db/connection');
const usersRoutes = require('./routes/users.routes');
const trainersRoutes = require('./routes/trainers.routes');
const subscriptionsRoutes = require('./routes/subscriptions.routes');
const app = express();

app.use(express.json());

app.use('/users', usersRoutes);
app.use('/trainers',trainersRoutes );
app.use('/subscriptions', subscriptionsRoutes);

app.get('/', (req, res) => {
    res.send('Gym Management API is running!');
});

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');

        res.json({
            message: 'Database connected successfully!',
            time: result.rows[0].now
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Database connection failed'
        });
    }
});

const PORT = 3009;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
