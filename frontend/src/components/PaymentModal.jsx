import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const PLANS = {
  pro: { name: 'Pro Plan', amount: '₹499', description: 'Unlimited todos + priority support' },
  enterprise: { name: 'Enterprise', amount: '₹1,499', description: 'All Pro features + team SLA' },
};

const PaymentModal = ({ plan, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuthStore();

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/payment/create-order', { plan });

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'TodoPro Enterprise',
        description: PLANS[plan].description,
        order_id: data.order.id,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#7c3aed' },
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            updateUser({ plan });
            toast.success(`🎉 Upgraded to ${PLANS[plan].name}!`);
            onSuccess?.();
            onClose();
          } catch { toast.error('Payment verification failed'); }
        },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => { toast.error(`Payment failed: ${r.error.description}`); setLoading(false); });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
      setLoading(false);
    }
  };

  const p = PLANS[plan];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal fade-in" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Upgrade Plan</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{p?.amount}</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '0.5rem' }}>{p?.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{p?.description}</div>
        </div>
        <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#a78bfa' }}>
          🔒 Secured by Razorpay — PCI DSS Compliant
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline btn-full" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-full" onClick={handlePay} disabled={loading}>
            {loading ? 'Processing...' : `Pay ${p?.amount}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
