import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';

const FEATURES = [
  { icon: '🔒', title: 'AES-256 Encryption', desc: 'Every todo is encrypted at field level. Your data is yours alone.' },
  { icon: '📱', title: 'MFA Protection', desc: 'Two-factor authentication with Google Authenticator for maximum security.' },
  { icon: '⚡', title: 'Redis Caching', desc: 'Lightning-fast responses with intelligent Redis caching layer.' },
  { icon: '🔐', title: 'JWT + OAuth', desc: 'Secure login with JWT tokens or Google OAuth 2.0 one-click sign-in.' },
  { icon: '💳', title: 'Razorpay Payments', desc: 'Seamless plan upgrades with India\'s most trusted payment gateway.' },
  { icon: '☸️', title: 'Kubernetes Ready', desc: 'Production-ready with Docker + Kubernetes deployment manifests.' },
];

const LandingPage = () => (
  <div className="page">
    <NavBar />
    <section className="hero">
      <div style={{ maxWidth: 680, textAlign: 'center' }}>
        <div className="hero-badge">🚀 Enterprise Grade Task Manager</div>
        <h1 className="hero-title">
          Manage Todos with<br />
          <span className="gradient-text">Enterprise Security</span>
        </h1>
        <p className="hero-subtitle">
          The only todo app with AES-256 encryption, MFA, Redis caching, OAuth, and Kubernetes deployment — built for professionals.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}>
            Get Started Free →
          </Link>
          <Link to="/login" className="btn btn-outline" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}>
            Sign In
          </Link>
        </div>
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <span>✓ Free plan forever</span>
          <span>✓ No credit card required</span>
          <span>✓ GDPR compliant</span>
        </div>
      </div>
    </section>

    <section className="features">
      <div className="container" style={{ textAlign: 'center' }}>
        <h2>Everything you need to stay <span className="gradient-text">secure & productive</span></h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>Built with enterprise security standards from the ground up.</p>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 style={{ marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section style={{ padding: '5rem 1.5rem', textAlign: 'center', background: 'var(--bg2)' }}>
      <h2>Ready to take control?</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: '2rem' }}>
        Join thousands of professionals using TodoPro.
      </p>
      <Link to="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.8rem 2.5rem' }}>
        Start for Free →
      </Link>
    </section>
  </div>
);

export default LandingPage;
