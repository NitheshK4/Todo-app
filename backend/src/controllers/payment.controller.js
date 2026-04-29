const { Payment, User } = require('../models');
const razorpayService = require('../services/razorpay.service');

// GET /api/payment/plans
const getPlans = (req, res) => {
  res.json({ success: true, plans: razorpayService.PLANS });
};

// POST /api/payment/create-order
const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    const { order, planDetails } = await razorpayService.createOrder(plan, req.user.id);

    await Payment.create({
      userId: req.user.id,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      receipt: order.receipt,
    });

    res.json({
      success: true,
      order,
      planDetails,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payment/verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const valid = razorpayService.verifySignature(
      razorpay_order_id, razorpay_payment_id, razorpay_signature
    );

    if (!valid)
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });

    const payment = await Payment.findOne({ where: { razorpayOrderId: razorpay_order_id } });
    if (!payment) return res.status(404).json({ success: false, message: 'Order not found' });

    await payment.update({ razorpayPaymentId: razorpay_payment_id, status: 'paid' });
    await User.update({ plan: payment.plan }, { where: { id: payment.userId } });

    res.json({ success: true, message: 'Payment verified! Plan upgraded.', plan: payment.plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/payment/history
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPlans, createOrder, verifyPayment, getPaymentHistory };
