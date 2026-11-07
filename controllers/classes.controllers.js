const pool = require("../db/connection");

// GET /class - retrieve all classes
const getAllClasses = async (req, res) => {
   try {
    const result = await pool.query('SELECT * FROM class ORDER BY class_id');
// the result variable contains the array of classes retrieved from the database
//then if we have a good data retrieval the res -> result will return status of 200 

    res.status(200).json(result.rows);
  } catch (err) {
    //if if we have a bad data retrieval the res will return 500 
    //this maybe because of unreachable database or the table may be not found 
    //or we may inserted the wrong password in the env file 

    console.error('Error fetching classes:', err.message);
    res.status(500).json({ error: 'Failed to retrieve classes' });
  }
};

const getClassesByID = async (req, res) => {
  try {
    // Extract the class ID from the request parameters

    const { id } = req.params;
    const result = await pool.query('SELECT * FROM class WHERE class_id = $1', [id]);
    //the [id] is used to pass the class ID as a parameter to the SQL query, preventing SQL injection attacks.
    //for security reasons 

    //if no data found about the class with the given id we will return 404 not found error

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    //if we have a good data retrieval the res -> result will return status of 200
    res.status(200).json(result.rows[0]);
  } catch (err) {
    //if their is a problem in the database connection  we will return 500 error
    console.error('Error fetching class by ID:', err.message);
    res.status(500).json({ error: 'Failed to retrieve class' });
  }
};
const AddAClass = async (req, res) => {
  try {
    const { class_name, description, schedule, duration, capacity } = req.body;

    if (!class_name || !schedule || !duration || !capacity) {
      return res.status(400).json({
        error: 'class_name, schedule, duration and capacity are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO class (class_name, description, schedule, duration, capacity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [class_name, description, schedule, duration, capacity]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating class:', err.message);
    res.status(500).json({ error: 'Failed to create class' });
  }
};
const UpdateAClass = async (req, res) => {
  try {
    const { id } = req.params;
// for the id validation

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid class id' });
    }
// Extract the fields to be updated from the request body
    const { class_name, description, schedule, duration, capacity } = req.body;
    //we check if the user provided any fields to update, if not we will return 400 error
    if (
      class_name === undefined &&
      description === undefined &&
      schedule === undefined &&
      duration === undefined &&
      capacity === undefined
    ) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }
// we insert the update query to update the class in the database,
//  using COALESCE to only update the fields that are provided in the request body. for example if the user only provides a new class_name, the other fields will remain unchanged.
//  The query returns the updated class, which is sent back in the response with a 200 status code.
    const result = await pool.query(
      `UPDATE class
       SET class_name  = COALESCE($1, class_name),
           description = COALESCE($2, description),
           schedule    = COALESCE($3, schedule),
           duration    = COALESCE($4, duration),
           capacity    = COALESCE($5, capacity)
       WHERE class_id = $6
       RETURNING *`,
      [class_name, description, schedule, duration, capacity, id]
      //[$1,$2 , ....]
    );
//for no data found 

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    //if their is a problem in the database connection  we will return 500 error
    console.error('Error updating class:', err.message);
    res.status(500).json({ error: 'Failed to update class' });
  }
};

const DeleteAClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ error: 'Invalid class id' });
    }
//we will delete the class from the database using the provided class ID.
    const result = await pool.query(
      'DELETE FROM class WHERE class_id = $1 RETURNING *',
      [id]
    );
    //if no data found about the class with the given id we will return 404 not found error

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
//if we have a good query the res -> result will return status of 200

    res.status(200).json({
      message: 'Class deleted successfully',
      deleted: result.rows[0],
    });
  } catch (err) {
    //for the FKs violation error, we will return 409 conflict error, indicating that the class cannot be deleted because it is still referenced by bookings or assigned trainers.
    // 23503 = foreign key violation (the class is still referenced by booking or trainer_class)
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'Cannot delete this class because it has bookings or assigned trainers',
      });
    }
    console.error('Error deleting class:', err.message);
    res.status(500).json({ error: 'Failed to delete class' });
  }
};

//it exports the three functions getAllClasses, getClassesByID, and postAClass so that they can be used in other parts of the application, such as in the routes defined in classes.routes.js.
module.exports = { getAllClasses, getClassesByID, AddAClass, UpdateAClass, DeleteAClass };