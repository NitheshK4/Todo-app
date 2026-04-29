const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, defaultValue: 'User' },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: true },
  oauthProvider: { type: DataTypes.STRING, allowNull: true },
  oauthId: { type: DataTypes.STRING, allowNull: true },
  mfaEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  mfaSecret: { type: DataTypes.TEXT, allowNull: true },
  mfaBackupCodes: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  plan: { type: DataTypes.ENUM('free', 'pro', 'enterprise'), defaultValue: 'free' },
  isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
}, { tableName: 'users', timestamps: true });

module.exports = User;
