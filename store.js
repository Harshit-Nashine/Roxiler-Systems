const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  address: {
    type: DataTypes.STRING(400),
    allowNull: false,
  },
  ownerId: {  // FK to User table (store owner)
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
}, {
  tableName: 'stores',
  timestamps: true,
});

Store.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

module.exports = Store;
