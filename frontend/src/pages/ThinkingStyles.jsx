/**
 * Thinking Styles — dramatic reveal of 3-4 matched thinking styles
 * after completing all 6 activities.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { assessmentAPI } from '../api/client';
import './ThinkingStyles.css';

const DOMAIN_LABELS = {
  backend: 'Backend',
  frontend: 'Frontend',
  devops: 'DevOps',
  data_eng: 'Data Engineering',
  ai_ml: 'AI/ML',
  cybersecurity: 'Cybersecurity',
  product_eng: 'Product Engineering',
};

const DOMAIN_COLORS = {
  backend: '#8b5cf6',
  frontend: '#06b6d4',
  devops: '#10b981',
  data_eng: '#f59e0b',
  ai_ml: '#ec4899',
  cybersecurity: '#ef4444',
  product_eng: '#3b82f6',
};

export default function ThinkingStyles() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [styles, setStyles] = useState([]);
  const [domainScores, setDomainScores] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [showIndex, setShowIndex] = useState(-1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const res = await assessmentAPI.getThinkingStyles();
        setStyles(res.data.thinking_styles || []);
        setDomainScores(res.data.domain_scores || null);
        setLoading(false);

        // Start reveal sequence after brief pause
        setTimeout(() => {
          setRevealed(true);
        }, 800);
      } catch (err) {
        setError('Could not load thinking styles. Please complete all activities first.');
        setLoading(false);
      }
    };
    fetchStyles();
  }, []);

  // Staggered reveal of each style card
  useEffect(() => {
    if (!revealed || styles.length === 0) return;
    let idx = 0;
    const interval = setInterval(() => {
      setShowIndex(idx);
      idx++;
      if (idx >= styles.length) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, [revealed, styles.length]);

  if (loading) {
    return (
      <div className="ts-page ts-loading">
        <motion.div
          className="loading-orb"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <h2>Analyzing your behavioral patterns…</h2>
        <p>Mapping signals to thinking styles</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ts-page ts-error">
        <h2>⚠️ {error}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/activity/1')}>
          Go to Activities
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="ts-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container">
        {/* Header */}
        <motion.div
          className="ts-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="ts-badge">Your Thinking DNA</span>
          <h1>
            Your <span className="gradient-text-vibrant">Thinking Styles</span>
          </h1>
          <p className="ts-subtitle">
            Based on how you approached the 6 challenges, here are the thinking
            patterns that define your engineering instincts.
          </p>
        </motion.div>

        {/* Style Cards */}
        <div className="ts-cards">
          <AnimatePresence>
            {styles.map((style, i) => (
              showIndex >= i && (
                <motion.div
                  key={style.style_key}
                  className={`ts-card ${i === 0 ? 'ts-card-primary' : ''}`}
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="ts-card-rank">#{i + 1}</div>
                  <div className="ts-card-icon">{style.icon || '🧠'}</div>
                  <h3 className="ts-card-name">
                    {style.style_key
                      .split('_')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')
                      .replace(/^/, 'The ')}
                  </h3>
                  <p className="ts-card-description">{style.description}</p>

                  {/* Confidence bar */}
                  <div className="ts-confidence">
                    <div className="ts-confidence-label">
                      <span>Confidence</span>
                      <span>{Math.round((style.confidence || 0) * 100)}%</span>
                    </div>
                    <div className="ts-confidence-bar">
                      <motion.div
                        className="ts-confidence-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${(style.confidence || 0) * 100}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* Primary domains */}
                  {style.primary_domains && style.primary_domains.length > 0 && (
                    <div className="ts-domains">
                      {style.primary_domains.map((d) => (
                        <span
                          key={d}
                          className="ts-domain-tag"
                          style={{ borderColor: DOMAIN_COLORS[d] || '#666', color: DOMAIN_COLORS[d] || '#999' }}
                        >
                          {DOMAIN_LABELS[d] || d}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        {/* Domain scores preview */}
        {domainScores && showIndex >= styles.length - 1 && (
          <motion.div
            className="ts-scores-preview glass-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
              Domain Signals <span className="gradient-text">Preview</span>
            </h3>
            <div className="ts-score-bars">
              {Object.entries(domainScores)
                .filter(([key]) => key !== 'id' && key !== 'session' && key !== 'validation_applied' && key !== 'updated_at')
                .sort(([, a], [, b]) => b - a)
                .map(([domain, score], i) => {
                  const maxScore = Math.max(
                    ...Object.entries(domainScores)
                      .filter(([k]) => k !== 'id' && k !== 'session' && k !== 'validation_applied' && k !== 'updated_at')
                      .map(([, v]) => v),
                    1
                  );
                  return (
                    <div key={domain} className="ts-score-row">
                      <span className="ts-score-label">{DOMAIN_LABELS[domain] || domain}</span>
                      <div className="ts-score-track">
                        <motion.div
                          className="ts-score-fill"
                          style={{ background: DOMAIN_COLORS[domain] || '#666' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(score / maxScore) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.1 * i }}
                        />
                      </div>
                      <span className="ts-score-value">{Math.round(score * 10) / 10}</span>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        {showIndex >= styles.length - 1 && (
          <motion.div
            className="ts-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/results')}
            >
              See Full Results →
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
