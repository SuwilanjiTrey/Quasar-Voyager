const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config(); // Add this line

const app = express();
const PORT = 3010;

app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the 'public' directory

// Serve the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/set-reminder', (req, res) => {
  const { email, reminder } = req.body;

  // Create a transporter for sending email
  let transporter = nodemailer.createTransport({
    service: 'gmail', // Use any email service you prefer
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Define the email options
  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Reminder',
    text: reminder
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: 'Failed to send reminder. Please try again.' });
    } else {
      return res.status(200).json({ message: 'Reminder sent successfully!' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
