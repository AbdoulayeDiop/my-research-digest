const adminOrBackendCheck = (req, res, next) => {
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
    const email = req.auth && req.auth.payload && req.auth.payload.email;

    // Check if sub matches pythonClientId (with or without @clients suffix)
    const isPythonBackend = pythonClientId && sub && (sub === pythonClientId || sub === `${pythonClientId}@clients`);
    const isAdmin = email && adminEmails.includes(email);

    if (!isPythonBackend && !isAdmin) {
      console.warn(`Access Denied - Sub: ${sub}, Email: ${email}, PythonClientId: ${pythonClientId}`);
      return res.status(403).json({ message: 'Forbidden: Access restricted to Admin or Backend.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = adminOrBackendCheck;
