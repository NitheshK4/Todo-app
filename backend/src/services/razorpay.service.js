const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

const PLANS = {
  pro: {
    name: 'Pro Plan',
    amount: 49900,     // ₹499 in paise
    currency: 'INR',
    description: 'Unlimited todos, priority support, advanced filters',
  },
  enterprise: {
    name: 'Enterprise Plan',
    amount: 149900,    // ₹1499 in paise
    currency: 'INR',
    description: 'Everything in Pro + team features, SLA, dedicated support',
  },
};

/** Create a Razorpay order */
const createOrder = async (plan, userId) => {
  const p = PLANS[plan];
  if (!p) throw new Error('Invalid plan selected');
  const order = await razorpay.orders.create({
    amount: p.amount,
    currency: p.currency,
    receipt: `rcpt_${userId.slice(0, 8)}_${Date.now()}`,
    notes: { userId, plan },
  });
  return { order, planDetails: p };
};

/** Verify Razorpay payment HMAC signature */
const verifySignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
    .update(body)
    .digest('hex');
  return expected === signature;
};

module.exports = { createOrder, verifySignature, PLANS };
