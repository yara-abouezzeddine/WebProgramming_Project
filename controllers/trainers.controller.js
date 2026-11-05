const pool = require('../db/connection');

// GET ALL TRAINERS
const getAllTrainers = async (req, res) => {
     try {
        const result = await pool.query(
            `SELECT *
             FROM trainer 
             
             ORDER BY trainer_id`
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error fetching trainers'
        });
    }
};


// GET TRAINER BY ID
 const getTrainerById = async (req, res) => {

//this is the route to get a specific trainer by their ID, which is passed as a parameter in the URL
    // the req.params creates an object containing the parameters of the request, in this case, the trainer ID
    //if we needed for example the name it would be req.params.name 

    try {
        //to store the trainer id 

        const trainerId = Number(req.params.id);
// now we are validationg the id if it is not a number 
//NAN is a global function that checks if a value is NaN (Not-a-Number). It returns true if the value is NaN, and false otherwise.
//if the condition is true, it means that the trainerId is not a valid number,
//  and we return a 400 Bad Request response with an error message.
        if (isNaN(trainerId)) {
            return res.status(400).json({
                message: 'Invalid trainer ID'
            });
        }
//we are retrieving the trainer details from the database 
// pool.query is used to execute a SQL query against the database.
//the query is a parameterized query, where $1 is a placeholder for the trainerId value.

        const result = await pool.query(
            'SELECT * FROM trainer WHERE trainer_id = $1',
            [trainerId]
        );
        //the second parameter is a value that will be substituted in the ? values 
        // where trainer_id= $1 $1 is the trainerId variable ctreated above 


        if (result.rows.length === 0) {
            //here we check the affected rows ->if it was zero so we don't have an id of such 
            //trainer not found or data not found res. status ->404 

            return res.status(404).json({
                message: 'Trainer not found'
            });
        }
        // since i am looking for 1 and only 1 row i returned the res as a json format to be tested on postman in a clear way 
        // row [0] the first one 
        res.status(200).json(result.rows[0]);

    } catch (error) {
        //or we have an error in fetching the table entirely 
        console.error(error);
        res.status(500).json({
            message: 'Error fetching trainer'
        });
    }
};

// CREATE TRAINER
const createTrainer = async (req, res) => {
       try {

        const {
            first_name,
            last_name,
            email,
            phone,
            specialization
        } = req.body;
//the req.body is an object that contains the data sent by the client in the request body.
//in this case, we are destructuring the req.body object to extract the values of first_name, last_name, email, phone, and specialization.


        const result = await pool.query(
// this is the query to insert a new trainer into the database.
// the query uses parameterized queries to prevent SQL injection attacks.
// the $1, $2, $3, $4, and $5 are placeholders for the values of first_name, last_name, email, phone, and specialization, respectively.
            `
            INSERT INTO trainer
            (first_name, last_name, email, phone, specialization)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                first_name,
                last_name,
                email,
                phone,
                specialization
            ]
        );
//res.status(201) is used to indicate that a new resource has been created successfully.

        res.status(201).json(result.rows[0]);

    } catch (error) {
        // this catch block is used to handle any errors that may occur during the execution of the try block.
        console.error(error);

        res.status(500).json({
            message: 'Error creating trainer'
        });
    }
//     try {

//         const {
//             first_name,
//             last_name,
//             email,
//             phone,
//             specialization
//         } = req.body;

//         const result = await pool.query(
//             `
//             INSERT INTO trainer
//             (
//                 first_name,
//                 last_name,
//                 email,
//                 phone,
//                 specialization
//             )
//             VALUES ($1,$2,$3,$4,$5)
//             RETURNING *
//             `,
//             [
//                 first_name,
//                 last_name,
//                 email,
//                 phone,
//                 specialization
//             ]
//         );

//         res.status(201).json(result.rows[0]);

//     } catch (error) {

//         console.error(error);

//         res.status(500).json({
//             message: 'Error creating trainer'
//         });
//     }
 };

module.exports = {
    getAllTrainers,
    getTrainerById,
    createTrainer
};