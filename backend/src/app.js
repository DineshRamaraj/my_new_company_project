const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();

let connection = null;
// Database connection
const connectionDB = () => {
  connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.DATABASE_PASSWORD,
    database: "e_commerce",
  });

  connection.connect(function (err) {
    if (err) {
      console.error("Error connecting to the database:", err);
      process.exit(1);
    }
    console.log("Connected to the database");
  });
};

connectionDB();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  console.log("Hello Dinesh");
  res.send("Hello Dinesh");
});

app.get("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(500).json({ message: "Username and Password are required" });
  }

  try {
    // Check if the user already exists
    const querySelect = "SELECT * FROM user WHERE name = ?";
    connection.query(querySelect, [username], async (err, results) => {
      if (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ message: "Internal server error1" });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      const queryInsert = "INSERT INTO user (name, password) VALUES (?, ?)";
      connection.query(
        queryInsert,
        [username, hashedPassword],
        (err, results) => {
          if (err) {
            console.error("Error inserting user:", err);
            return res.status(500).json({ message: "Internal server error" });
          }

          res.status(201).json({ message: "User registered successfully" });
        }
      );
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post('/login/', async (request, response) => {
    const { username, password } = request.body;

    try {
        const querySelect = 'SELECT * FROM user WHERE name = ?';
        connection.query(querySelect, [username], async (err, results) => {
            if (err) {
                console.error('Error fetching user:', err);
                return response.status(500).json({ message: 'Internal server error' });
            }

            if (results.length === 0) {
                return response.status(400).json({ message: 'Invalid User' });
            }

            const user = results[0];
            console.log('User:', user);
            console.log('Password from DB:', user.Password);
            
            // Compare the password
            const isPasswordMatched = await bcrypt.compare(password, user.Password);

            if (isPasswordMatched) {
                const payload = { username: username };
                const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN');
                response.status(200).send({ jwtToken });
            } else {
                response.status(400).send('Invalid Password');
            }
        });
    } catch (err) {
        console.error('Error during login:', err);
        response.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log('Server listening on port 3000...');
});