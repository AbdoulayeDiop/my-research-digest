require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const newsletterRoutes = require('./routes/newsletters');
const issueRoutes = require('./routes/issues');
const paperRoutes = require('./routes/papers');
const userRoutes = require('./routes/users');
const jwtCheck = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myresearchdigest';

// Middleware
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];

app.use(cors({
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
app.use(express.json()); // For parsing application/json

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/newsletters', jwtCheck, newsletterRoutes);
app.use('/api/newsletters/:newsletterId/issues', jwtCheck, issueRoutes); // For newsletter-specific issue operations
app.use('/api/issues', jwtCheck, issueRoutes); // For general issue operations (like count)
app.use('/api/papers', jwtCheck, paperRoutes);
app.use('/api/users', jwtCheck, userRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('My Research Digest Node.js Backend API');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});