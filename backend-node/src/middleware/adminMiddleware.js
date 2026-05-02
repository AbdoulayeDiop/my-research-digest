const User = require('../models/User');

const adminOrBackendCheck = async (req, res, next) => {
  try {
    const pythonClientId = process.env.AUTH0_PYTHON_CLIENT_ID;
    const sub = req.auth && req.auth.payload && req.auth.payload.sub;

    const isPythonBackend = pythonClientId && sub && (sub === pythonClientId || sub === `${pythonClientId}@clients`);
    if (isPythonBackend) {
      return next();
    }

    const user = sub ? await User.findOne({ auth0Id: sub }, 'role') : null;
    if (!user || user.role !== 'admin') {
      console.warn(`Access Denied - Sub: ${sub}`);
      return res.status(403).json({ message: 'Forbidden: Access restricted to Admin or Backend.' });
    }

    next();
  } catch (error) {
    console.error("Error in adminOrBackendCheck:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = adminOrBackendCheck;
