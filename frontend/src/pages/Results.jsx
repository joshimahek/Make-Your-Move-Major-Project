/**
 * Results — final domain scores with visualization, thinking styles summary,
 * and links to personalized roadmaps.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { assessmentAPI } from '../api/client';
import './Results.css';

const DOMAIN_META = {
  backend: { label: 'Backend', icon: '⚙️', color: '#8b5cf6', desc: 'Build the systems behind the interface.' },
  frontend: { label: 'Frontend', icon: '🎨', color: '#06b6d4', desc: 'Craft experiences people love to use.' },
  devops: { label: 'DevOps', icon: '🛡️', color: '#10b981', desc: 'Keep systems alive, fast, and reliable.' },
  data_eng: { label: 'Data Eng', icon: '📊', color: '#f59e0b', desc: 'Build pipelines that turn data into insight.' },
  ai_ml: { label: 'AI/ML', icon: '🤖', color: '#ec4899', desc: 'Teach machines to learn and decide.' },
  cybersecurity: { label: 'Cybersecurity', icon: '🔒', color: '#ef4444', desc: 'Protect systems from those who would break them.' },
  product_eng: { label: 'Product', icon: '🎯', color: '#3b82f6', desc: 'Bridge user needs and engineering decisions.' },
};

export default function Results() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [domainScores, setDomainScores] = useState(null);
  const [thinkingStyles, setThinkingStyles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await assessmentAPI.getResults();
        setDomainScores(res.data.domain_scores || null);
        setThinkingStyles(res.data.thinking_styles || []);
        setLoading(false);
      } catch (err) {
        setError('Could not load results. Please complete the assessment first.');
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="results-page results-loading">
        <motion.div
          className="loading-orb"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <h2>Calculating your results…</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-page results-error">
        <h2>⚠️ {error}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Start Over
        </button>
      </div>
    );
  }

  // Build ranked domain list
  const scoreEntries = domainScores
    ? Object.entries(domainScores)
        .filter(([key]) => DOMAIN_META[key])
        .sort(([, a], [, b]) => b - a)
    : [];

  const maxScore = scoreEntries.length > 0 ? Math.max(...scoreEntries.map(([, v]) => v), 1) : 1;
  const totalScore = scoreEntries.reduce((s, [, v]) => s + v, 0) || 1;

  return (
    <motion.div
      className="results-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container">
        {/* Header */}
        <motion.div
          className="results-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1>
            Your <span className="gradient-text-vibrant">Domain Map</span>
          </h1>
          <p className="results-subtitle">
            Here's where your natural instincts align across the 7 software engineering domains.
          </p>
        </motion.div>

        {/* Top 3 podium */}
        {scoreEntries.length >= 3 && (
          <div className="results-podium">
            {scoreEntries.slice(0, 3).map(([domain, score], i) => {
              const meta = DOMAIN_META[domain];
              const pct = Math.round((score / totalScore) * 100);
              const heights = ['200px', '160px', '130px'];
              const delays = [0.4, 0.2, 0.6];

              return (
                <motion.div
                  key={domain}
                  className={`podium-item podium-${i + 1}`}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: delays[i], ease: [0.22, 1, 0.36, 1] }}
                  style={{ order: i === 0 ? 1 : i === 1 ? 0 : 2 }}
                >
                  <span className="podium-icon">{meta.icon}</span>
                  <span className="podium-label">{meta.label}</span>
                  <span className="podium-pct">{pct}%</span>
                  <motion.div
                    className="podium-bar"
                    style={{ background: meta.color }}
                    initial={{ height: 0 }}
                    animate={{ height: heights[i] }}
                    transition={{ duration: 0.8, delay: delays[i] + 0.2, ease: 'easeOut' }}
                  />
                  <span className="podium-rank">#{i + 1}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full score breakdown */}
        <motion.div
          className="results-breakdown glass-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <h3 style={{ marginBottom: 'var(--space-6)' }}>Full Breakdown</h3>
          {scoreEntries.map(([domain, score], i) => {
            const meta = DOMAIN_META[domain];
            const pct = Math.round((score / totalScore) * 100);
            return (
              <motion.div
                key={domain}
                className="score-row"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
              >
                <div className="score-row-left">
                  <span className="score-row-icon">{meta.icon}</span>
                  <div>
                    <span className="score-row-label">{meta.label}</span>
                    <span className="score-row-desc">{meta.desc}</span>
                  </div>
                </div>
                <div className="score-row-right">
                  <div className="score-bar-track">
                    <motion.div
                      className="score-bar-fill"
                      style={{ background: meta.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(score / maxScore) * 100}%` }}
                      transition={{ duration: 0.8, delay: 1.2 + i * 0.1 }}
                    />
                  </div>
                  <span className="score-value">{pct}%</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Thinking styles summary */}
        {thinkingStyles.length > 0 && (
          <motion.div
            className="results-styles glass-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
          >
            <h3 style={{ marginBottom: 'var(--space-6)' }}>Your Thinking Styles</h3>
            <div className="styles-mini-grid">
              {thinkingStyles.map((style) => (
                <div key={style.style_key} className="style-mini-card">
                  <span className="style-mini-icon">{style.icon || '🧠'}</span>
                  <span className="style-mini-name">
                    {style.style_key
                      .split('_')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')
                      .replace(/^/, 'The ')}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Roadmap CTAs */}
        <motion.div
          className="results-roadmaps"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
          <h3 style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            Explore Your <span className="gradient-text">Roadmaps</span>
          </h3>
          <div className="roadmap-cards">
            {scoreEntries.slice(0, 3).map(([domain, score], i) => {
              const meta = DOMAIN_META[domain];
              const pct = Math.round((score / totalScore) * 100);
              return (
                <motion.button
                  key={domain}
                  className="roadmap-card glass-card"
                  onClick={() => navigate(`/deep-dive/${domain}`)}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="roadmap-card-icon">{meta.icon}</span>
                  <span className="roadmap-card-label">{meta.label}</span>
                  <span className="roadmap-card-match" style={{ color: meta.color }}>
                    {pct}% match
                  </span>
                  <span className="roadmap-card-cta">View Roadmap →</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Reset */}
        <motion.div
          className="results-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
