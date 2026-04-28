const User = require('../models/User');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  tls: { rejectUnauthorized: false },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendAnnouncement = async (req, res) => {
  try {
    const { subject, html } = req.body;
    if (!subject || !html) {
      return res.status(400).json({ message: 'subject and html are required.' });
    }

    const users = await User.find({ email: { $exists: true, $ne: null } }, 'email name');

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      if (!user.email) continue;
      try {
        await transporter.sendMail({
          from: `"My Research Digest" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject,
          html: html.replace(/\{\{name\}\}/g, user.name || 'there'),
        });
        sent++;
      } catch {
        failed++;
      }
      // Throttle to avoid SMTP rate limits
      await new Promise((r) => setTimeout(r, 300));
    }

    res.json({ total: users.length, sent, failed });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({ message: 'Failed to send announcement.' });
  }
};
