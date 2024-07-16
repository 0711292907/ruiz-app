const express = require('express');
const app = express()
const port = 5000
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()
const pool = require('./connect')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')

app.use(bodyParser.json())
app.use(cookieParser())

app.use(cors({
    orign: 'http://localhost:3000',
    credentials: true
}))

app.post('/signup', async (req,res) => {
    const {name, email, password} = req.body;

    try {
      const results = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email])
      const user = results[0]
      
      if(user.length > 0) {
        return res.status(400).json({
            status: false,
            message: 'User email already registered. Please login'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const query = 'INSERT INTO users (Name, Email, password) VALUES (?,?,?)'
      await pool.promise().query(query,[name,email,hashedPassword])


     const token = await jwt.sign({name, email}, process.env.JWT_SECRET, {expiresIn: '1h'})
     
     res.cookie('token', token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60
     })

      return res.status(200).json({
        status: true,
        token: token,
        message: 'account created succefully.'
    });

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: false,
            message: 'Server Error.'
        });
    }
})


// login 
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Check if email exists in the database
      const results = await pool.promise().query('SELECT * FROM users WHERE email = ?', [email]);
      const user = results[0][0]; // Assuming only one user can have that email (get the first element from the first array)
  
      if (!user) {
        return res.status(401).json({
          status: false,
          message: 'Incorrect email or password.',
        });
      }
  
      // Compare hashed password with the provided password
      const isPasswordMatch = await bcrypt.compare(password, user.password); // user.password is the hashed password stored in the database
  
      if (!isPasswordMatch) {
        return res.status(401).json({
          status: false,
          message: 'Incorrect email or password.',
        });
      }
  
      // Generate JWT token on successful login
      const token = await jwt.sign({ name: user.Name, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Set the token cookie
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60, // One hour in milliseconds
      });
  
      return res.status(200).json({
        status: true,
        token,
        message: 'Login successful.',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        status: false,
        message: 'Server Error.',
      });
    }
  });
  
  app.listen(port, console.log(`app is listening on ${port}`)) 