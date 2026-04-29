const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  razorpayOrderId: { type: DataTypes.STRING, allowNull: false },
  razorpayPaymentId: { type: DataTypes.STRING, allowNull: true },
  amount: { type: DataTypes.INTEGER, allowNull: false }, // in paise
  currency: { type: DataTypes.STRING, defaultValue: 'INR' },
  status: { type: DataTypes.ENUM('created', 'paid', 'failed', 'refunded'), defaultValue: 'created' },
  plan: { type: DataTypes.ENUM('pro', 'enterprise'), allowNull: false },
  receipt: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'payments', timestamps: true });

module.exports = Payment;
