const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Todo = sequelize.define('Todo', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.TEXT, allowNull: false },       // AES-256-GCM encrypted
  description: { type: DataTypes.TEXT, allowNull: true },  // AES-256-GCM encrypted
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  status: { type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'archived'), defaultValue: 'pending' },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  isEncrypted: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'todos', timestamps: true });

module.exports = Todo;
