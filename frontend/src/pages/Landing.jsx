/**
 * Landing Page — Enterprise-level hero, navbar, interactive sections, and footer.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useAssessment } from '../context/AssessmentContext';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

/* ═══ Data ═══ */
const FEATURES = [
  {
    icon: '🧠',
    title: 'Behavior, Not Surveys',
    desc: 'We watch how you think through problems — not what you say about yourself.',
  },
  {
    icon: '🎯',
    title: '6 Interactive Challenges',
    desc: 'Drag, sort, and build your way through real engineering scenarios.',
  },
  {
    icon: '📊',
    title: '7 Career Domains',
    desc: 'Backend, Frontend, DevOps, Data, AI/ML, Cybersecurity, and Product.',
  },
  {
    icon: '🗺️',
    title: 'Personalized Roadmap',
    desc: 'Get a learning path tailored to your natural thinking style.',
  },
];

const DOMAINS = [
  { key: 'backend', label: 'Backend', icon: '⚙️', color: 'var(--color-backend)', desc: 'Build robust APIs, databases, and server infrastructure.' },
  { key: 'frontend', label: 'Frontend', icon: '🎨', color: 'var(--color-frontend)', desc: 'Craft beautiful, responsive user experiences.' },
  { key: 'devops', label: 'DevOps', icon: '🛡️', color: 'var(--color-devops)', desc: 'Automate pipelines and keep systems reliable.' },
  { key: 'data_eng', label: 'Data Eng', icon: '📊', color: 'var(--color-data)', desc: 'Design pipelines that turn raw data into insights.' },
  { key: 'ai_ml', label: 'AI / ML', icon: '🤖', color: 'var(--color-ai)', desc: 'Train models and deploy intelligent systems.' },
  { key: 'cybersecurity', label: 'Security', icon: '🔒', color: 'var(--color-cyber)', desc: 'Protect systems from threats and vulnerabilities.' },
  { key: 'product_eng', label: 'Product', icon: '🎯', color: 'var(--color-product)', desc: 'Bridge user needs with engineering decisions.' },
];

const TESTIMONIALS = [
  { name: 'Aarav M.', role: 'CS Student, Year 3', text: 'I always thought I wanted to do AI, but the assessment showed I naturally think like a systems architect. Now I\'m loving DevOps!', avatar: '👨‍💻' },
  { name: 'Priya S.', role: 'Bootcamp Graduate', text: 'The interactive activities felt like real puzzles, not boring questionnaires. My roadmap was exactly what I needed to focus.', avatar: '👩‍💻' },
  { name: 'James L.', role: 'Career Switcher', text: 'Within 15 minutes, I had more clarity about my direction than months of YouTube tutorials gave me.', avatar: '🧑‍💻' },
];

const FAQS = [
  { q: 'How long does the assessment take?', a: 'About 15 minutes. You\'ll complete 6 interactive activities, review your thinking styles, and get a personalized roadmap.' },
  { q: 'Is this another personality quiz?', a: 'No. Make Your Move analyzes how you interact with engineering problems — your drag patterns, decision timing, and prioritization choices — not self-reported preferences.' },
  { q: 'Do I need coding experience?', a: 'Not at all! The activities are designed for everyone from complete beginners to experienced developers. We adjust difficulty based on your background.' },
  { q: 'Is my data private?', a: 'Yes. Your behavioral data is only used to generate your results. We don\'t share it with third parties or use it for advertising.' },
  { q: 'Can I retake the assessment?', a: 'Absolutely. You can reset and start fresh at any time from the landing page.' },
];

const STATS = [
  { value: 7, suffix: '', label: 'Career Domains' },
  { value: 6, suffix: '', label: 'Interactive Activities' },
  { value: 8, suffix: '', label: 'Thinking Styles' },
  { value: 15, suffix: 'min', label: 'Average Duration' },
];

/* ═══ Sub-components ═══ */

function AnimatedCounter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView) return;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function FAQItem({ q, a, isOpen, onClick }) {
  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`} onClick={onClick}>
      <div className="faq-question">
        <span>{q}</span>
        <motion.span
          className="faq-chevron"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          ▾
        </motion.span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="faq-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══ Main Component ═══ */
export default function Landing() {
  const navigate = useNavigate();
  const { startSession, session, hydrated, activityOrder, completedActivities } = useAssessment();
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDomain, setActiveDomain] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const hasActiveSession = hydrated && session && session.current_stage !== 'context_intake';

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleStart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await startSession();
      navigate('/context');
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleContinue = () => {
    const stage = session?.current_stage;
    if (stage === 'results' || stage === 'completed') {
      navigate('/results');
    } else if (stage === 'thinking_styles' || stage === 'validation') {
      navigate('/thinking-styles');
    } else if (stage === 'pre_assessment') {
      const next = activityOrder.find(n => !completedActivities.has(n));
      navigate(`/activity/${next || activityOrder[0]}`);
    } else {
      navigate('/context');
    }
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing">
      {/* ─── Navbar ─────────────────────────── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-icon">◆</span>
            <span className="nav-logo-text">Make Your Move</span>
          </Link>

          <div className="nav-links-desktop">
            <button className="nav-link" onClick={() => scrollToSection('features')}>Features</button>
            <button className="nav-link" onClick={() => scrollToSection('domains')}>Domains</button>
            <button className="nav-link" onClick={() => scrollToSection('how-it-works')}>How It Works</button>
            <button className="nav-link" onClick={() => scrollToSection('faq')}>FAQ</button>
          </div>

          <div className="nav-actions">
            {isAuthenticated ? (
              <button className="nav-link" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
            ) : (
              <Link to="/login" className="nav-link">Sign In</Link>
            )}
            <button className="btn btn-primary btn-sm nav-cta" onClick={hasActiveSession ? handleContinue : handleStart}>
              {hasActiveSession ? 'Continue' : 'Get Started'}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <button className="mobile-menu-link" onClick={() => scrollToSection('features')}>Features</button>
              <button className="mobile-menu-link" onClick={() => scrollToSection('domains')}>Domains</button>
              <button className="mobile-menu-link" onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              <button className="mobile-menu-link" onClick={() => scrollToSection('faq')}>FAQ</button>
              {isAuthenticated ? (
                <button className="mobile-menu-link" onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>Logout</button>
              ) : (
                <Link to="/login" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              )}
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-2)' }} onClick={hasActiveSession ? handleContinue : handleStart}>
                {hasActiveSession ? 'Continue Assessment' : 'Get Started Free'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── Background orbs ─────────────────── */}
      <div className="landing-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ─── Hero ────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              🚀 Career Discovery for Engineers
            </motion.span>

            <h1 className="hero-title">
              Discover Where You <br />
              <span className="gradient-text-vibrant">Truly Belong</span> in Tech
            </h1>

            <p className="hero-subtitle">
              Make Your Move uses behavioral signals — not self-reported preferences —
              to reveal which software engineering domains match how you actually think.
            </p>

            <motion.div
              className="hero-cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {hasActiveSession ? (
                <>
                  <button className="btn btn-primary btn-lg cta-button" onClick={handleContinue}>
                    Continue Assessment
                    <span className="cta-arrow">→</span>
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <span className="cta-meta">
                      {completedActivities.size} of 6 activities complete
                    </span>
                    <button onClick={handleStart} className="start-over-link">
                      Start over
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button className="btn btn-primary btn-lg cta-button" onClick={handleStart}>
                    Start Your Assessment
                    <span className="cta-arrow">→</span>
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <span className="cta-meta">Takes ~15 minutes • Free forever</span>
                    {!isAuthenticated && (
                      <span className="cta-meta" style={{ fontSize: 'var(--font-size-sm)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--color-accent-2)', fontWeight: 600 }}>
                          Sign in
                        </Link>
                      </span>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <div className="domain-orbit">
              {['⚙️', '🎨', '🛡️', '📊', '🤖', '🔒', '🎯'].map((icon, i) => (
                <motion.div
                  key={i}
                  className="domain-icon"
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                >
                  {icon}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Trust Bar ───────────────────────── */}
      <section className="trust-bar">
        <div className="container">
          <motion.div
            className="trust-inner"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {['Built with Django & React', 'Behavioral Science Backed', 'Open Source', 'Privacy First'].map((text, i) => (
              <div key={i} className="trust-item">
                <span className="trust-check">✓</span>
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Counter ───────────────────── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                className="stat-card glass-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <span className="stat-value gradient-text-vibrant">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </span>
                <span className="stat-label">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────── */}
      <section className="features" id="features">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">Why Make Your Move</span>
            <h2>Not Your Ordinary <span className="gradient-text">Career Quiz</span></h2>
            <p className="section-desc">
              We go beyond surveys. Our behavioral engine observes how you solve problems
              in real-time to map your natural strengths.
            </p>
          </motion.div>

          <motion.div
            className="features-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                className="glass-card feature-card"
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
              >
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Domain Explorer ─────────────────── */}
      <section className="domain-explorer" id="domains">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">Explore Domains</span>
            <h2>7 Paths, One <span className="gradient-text">That's Yours</span></h2>
            <p className="section-desc">
              Each domain represents a unique way engineers create impact. Discover which resonates with you.
            </p>
          </motion.div>

          <div className="domain-tabs">
            {DOMAINS.map((d, i) => (
              <motion.button
                key={d.key}
                className={`domain-tab ${activeDomain === i ? 'active' : ''}`}
                onClick={() => setActiveDomain(i)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ '--domain-color': d.color }}
              >
                <span className="domain-tab-icon">{d.icon}</span>
                <span className="domain-tab-label">{d.label}</span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeDomain}
              className="domain-detail glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{ '--domain-color': DOMAINS[activeDomain].color }}
            >
              <div className="domain-detail-icon">{DOMAINS[activeDomain].icon}</div>
              <h3>{DOMAINS[activeDomain].label} Engineering</h3>
              <p>{DOMAINS[activeDomain].desc}</p>
              <div className="domain-detail-cta">
                <button className="btn btn-primary btn-sm" onClick={hasActiveSession ? handleContinue : handleStart}>
                  Discover if this is your fit →
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ─── How It Works ────────────────────── */}
      <section className="how-it-works" id="how-it-works">
        <div className="container container-sm text-center">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">The Process</span>
            <h2>How It <span className="gradient-text">Works</span></h2>
          </motion.div>

          <div className="steps">
            {[
              { num: '01', title: '3 Quick Questions', desc: 'Tell us your year and goals to personalize your journey.', icon: '📝' },
              { num: '02', title: '6 Interactive Tasks', desc: 'Drag, sort, and build through real engineering scenarios.', icon: '🎮' },
              { num: '03', title: 'Thinking Style Reveal', desc: 'See which thinking styles match your natural instincts.', icon: '💡' },
              { num: '04', title: 'Explore Your Domains', desc: 'Dive into personalized roadmaps for your top matches.', icon: '🗺️' },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="step-item glass-card"
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <div className="step-num-circle">
                  <span className="step-icon">{step.icon}</span>
                </div>
                <div className="step-connector" />
                <div className="step-body">
                  <span className="step-num gradient-text">{step.num}</span>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────── */}
      <section className="testimonials-section">
        <div className="container container-sm text-center">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">Testimonials</span>
            <h2>What Users <span className="gradient-text">Say</span></h2>
          </motion.div>

          <div className="testimonial-carousel">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                className="testimonial-card glass-card"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              >
                <div className="testimonial-avatar">{TESTIMONIALS[activeTestimonial].avatar}</div>
                <blockquote className="testimonial-text">
                  "{TESTIMONIALS[activeTestimonial].text}"
                </blockquote>
                <div className="testimonial-author">
                  <strong>{TESTIMONIALS[activeTestimonial].name}</strong>
                  <span>{TESTIMONIALS[activeTestimonial].role}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="testimonial-dots">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  className={`testimonial-dot ${i === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────── */}
      <section className="faq-section" id="faq">
        <div className="container container-sm">
          <motion.div
            className="section-header text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">FAQ</span>
            <h2>Common <span className="gradient-text">Questions</span></h2>
          </motion.div>

          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                q={faq.q}
                a={faq.a}
                isOpen={openFAQ === i}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────── */}
      <section className="final-cta">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Ready to Discover Your <span className="gradient-text-vibrant">Path</span>?</h2>
            <p className="section-desc" style={{ margin: 'var(--space-4) auto var(--space-8)' }}>
              Join thousands of aspiring engineers who found clarity in under 15 minutes.
            </p>
            <button className="btn btn-primary btn-lg cta-button" onClick={hasActiveSession ? handleContinue : handleStart}>
              {hasActiveSession ? 'Continue Your Journey' : 'Start Free Assessment'}
              <span className="cta-arrow">→</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="nav-logo" style={{ marginBottom: 'var(--space-4)' }}>
                <span className="nav-logo-icon">◆</span>
                <span className="nav-logo-text">Make Your Move</span>
              </div>
              <p className="footer-tagline">
                Behavior-driven career discovery for the next generation of software engineers.
              </p>
              <div className="footer-socials">
                <a href="#" className="social-icon" aria-label="GitHub">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.776.42-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
                </a>
                <a href="#" className="social-icon" aria-label="Twitter">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="#" className="social-icon" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Platform</h4>
              <button className="footer-link" onClick={() => scrollToSection('features')}>Features</button>
              <button className="footer-link" onClick={() => scrollToSection('domains')}>Domains</button>
              <button className="footer-link" onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              <button className="footer-link" onClick={() => scrollToSection('faq')}>FAQ</button>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Resources</h4>
              <a href="#" className="footer-link">Documentation</a>
              <a href="#" className="footer-link">Blog</a>
              <a href="#" className="footer-link">Changelog</a>
              <a href="#" className="footer-link">Roadmap</a>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Legal</h4>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
              <a href="#" className="footer-link">Cookie Policy</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Make Your Move. Built with 💜 for aspiring engineers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
