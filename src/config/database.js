const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // For Neon DB
    },
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Sequelize: Database connection has been established successfully.');
    
    // Sync models
    // await sequelize.sync({ alter: true }); // Careful with this in production
  } catch (error) {
    console.error('Sequelize: Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, connectDB };
