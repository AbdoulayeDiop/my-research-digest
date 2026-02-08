const User = require('../models/User');

const adminOrBackendCheck = async (req, res, next) => {
  try {
    const adminEmailsStr = process.env.ADMIN_EMAILS;
    let adminEmails = [];

    if (adminEmailsStr) {
      try {
        adminEmails = JSON.parse(adminEmailsStr);
        if (!Array.isArray(adminEmails)) {
          adminEmails = [];
        }
      } catch (e) {
        console.error("Error parsing ADMIN_EMAILS:", e);
        adminEmails = [];
      }
    }

    const pythonClientId = process.env.AUTH0_PYTHON_CLIENT_ID;
    const sub = req.auth && req.auth.payload && req.auth.payload.sub;
    let email = req.auth && req.auth.payload && req.auth.payload.email;

    // Check if it's the Python backend first
    const isPythonBackend = pythonClientId && sub && (sub === pythonClientId || sub === `${pythonClientId}@clients`);
    
    if (isPythonBackend) {
      return next();
    }

    // If not backend and email is missing from payload, look up in database
    if (!email && sub) {
      const user = await User.findOne({ auth0Id: sub });
      if (user) {
        email = user.email;
      }
    }

    const isAdmin = email && adminEmails.includes(email);

    if (!isAdmin) {
      console.warn(`Access Denied - Sub: ${sub}, Email: ${email}, PythonClientId: ${pythonClientId}`);
      return res.status(403).json({ message: 'Forbidden: Access restricted to Admin or Backend.' });
    }

    next();
  } catch (error) {
    console.error("Error in adminOrBackendCheck:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = adminOrBackendCheck;
