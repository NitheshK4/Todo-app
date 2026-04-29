import { useState } from 'react';
import NavBar from '../components/NavBar';
import PaymentModal from '../components/PaymentModal';
import useAuthStore from '../store/authStore';

const PLANS = [
  {
    id: 'free', name: 'Free', price: '₹0', period: '/forever',
    features: ['Up to 10 todos', 'Basic filtering', 'AES-256 encryption', 'JWT authentication'],
    cta: 'Current Plan', disabled: true,
  },
  {
    id: 'pro', name: 'Pro', price: '₹499', period: '/month', popular: true,
    features: ['Unlimited todos', 'All filters & search', 'Redis caching', 'Priority support', 'MFA security', 'Tags & due dates'],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'enterprise', name: 'Enterprise', price: '₹1,499', period: '/month',
    features: ['Everything in Pro', 'Team workspace', 'Advanced analytics', 'Dedicated support', 'SLA guarantee', 'Custom integrations', 'Audit logs'],
    cta: 'Get Enterprise',
  },
];

const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { user } = useAuthStore();

  return (
    <div className="page">
      <NavBar />
      <section className="pricing">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Simple, <span className="gradient-text">Transparent Pricing</span></h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: '3rem' }}>
            Start free, upgrade when you need more power. No hidden fees.
          </p>
          <div className="pricing-grid">
            {PLANS.map(plan => (
              <div key={plan.id} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="popular-badge">⭐ Most Popular</div>}
                <h3>{plan.name}</h3>
                <div className="plan-price">{plan.price}</div>
                <div className="plan-period">{plan.period}</div>
                <ul className="plan-features">
                  {plan.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <button
                  className={`btn btn-full ${plan.popular ? 'btn-primary' : 'btn-outline'}`}
                  disabled={plan.disabled || user?.plan === plan.id}
                  onClick={() => !plan.disabled && setSelectedPlan(plan.id)}
                >
                  {user?.plan === plan.id ? '✓ Current Plan' : plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            🔒 All payments secured by Razorpay · PCI DSS compliant · 30-day refund guarantee
          </p>
        </div>
      </section>

      {selectedPlan && (
        <PaymentModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}
    </div>
  );
};

export default PricingPage;
