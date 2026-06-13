const sequelize = require('../config/db');
const User = require('./User');
const Todo = require('./Todo');
const Payment = require('./Payment');
const Subtask = require('./Subtask');

// Associations
User.hasMany(Todo, { foreignKey: 'userId', as: 'todos', onDelete: 'CASCADE' });
Todo.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Subtask Associations
Todo.hasMany(Subtask, { foreignKey: 'todoId', as: 'subtasks', onDelete: 'CASCADE' });
Subtask.belongsTo(Todo, { foreignKey: 'todoId', as: 'todo' });

module.exports = { sequelize, User, Todo, Payment, Subtask };

