const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Subtask = sequelize.define('Subtask', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  todoId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.TEXT, allowNull: false },       // AES-256-GCM encrypted
  isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  isEncrypted: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'subtasks', timestamps: true });

module.exports = Subtask;
