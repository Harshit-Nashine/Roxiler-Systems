const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');  // optional security headers

dotenv.config();

const sequelize = require('./config/db');

const User = require('./models/user');
const Store = require('./models/store');
const Rating = require('./models/rating');

// Associations
User.hasMany(Rating, { foreignKey: 'userId' });
Rating.belongsTo(User, { foreignKey: 'userId' });

Store.hasMany(Rating, { foreignKey: 'storeId' });
Rating.belongsTo(Store, { foreignKey: 'storeId' });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());  // adds security headers (optional)
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));

app.get('/', (req, res) => {
  res.send('✅ Backend is running!');
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Sync DB and start server
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Database synced');
    app.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Unable to sync database:', err);
  });
