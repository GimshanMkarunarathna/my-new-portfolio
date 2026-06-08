require('dotenv').config();
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ success: false, message: 'Fill all required fields.' });
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({
      from: email, to: process.env.EMAIL_USER,
      subject: `Portfolio: ${subject || 'New Message'} from ${name}`,
      html: `<p><b>From:</b> ${name} (${email})</p><p><b>Message:</b></p><p>${message}</p>`
    });
  } catch (e) { console.error(e); }
  res.json({ success: true, message: 'Message received!' });
});

app.listen(PORT, () => console.log(`\n🚀  http://localhost:${PORT}\n`));
