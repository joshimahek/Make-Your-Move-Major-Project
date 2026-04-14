/**
 * Activity 6: Feature Triage
 * Categorize features into Ship / Reconsider / Cut for a product launch.
 * Tracks: categories { ship: [], reconsider: [], cut: [] }
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivitySubmit } from '../../api/useActivitySubmit';
import './Activities.css';

const FEATURES = [
  { id: '2fa', label: '2FA', icon: '🔐', desc: 'Two-factor authentication for all users' },
  { id: 'notifs', label: 'In-App Notifications', icon: '🔔', desc: 'Real-time push notifications inside the app' },
  { id: 'ai-onboard', label: 'AI Onboarding', icon: '🤖', desc: 'AI-powered personalized onboarding flow' },
  { id: 'badges', label: 'Profile Badges', icon: '🏅', desc: 'Gamification badges on user profiles' },
  { id: 'dark-mode', label: 'Dark Mode', icon: '🌙', desc: 'System-wide dark theme toggle' },
  { id: 'social-login', label: 'Social Login', icon: '🔗', desc: 'Sign in with Google, GitHub, etc.' },
  { id: 'export-pdf', label: 'Export to PDF', icon: '📄', desc: 'Export user reports as PDF documents' },
  { id: 'search', label: 'Full-Text Search', icon: '🔍', desc: 'Search across all content with filters' },
];

const CATEGORIES = [
  { key: 'ship', label: '🚀 Ship', desc: 'Must have for launch', className: 'ship' },
  { key: 'reconsider', label: '⚠️ Reconsider', desc: 'Needs more thought', className: 'reconsider' },
  { key: 'cut', label: '✂️ Cut', desc: 'Not this release', className: 'cut' },
];

export default function Activity6FeatureTriage({ activityNumber, title }) {
  const [assignments, setAssignments] = useState({}); // { featureId: 'ship'|'reconsider'|'cut' }
  const startTime = useRef(Date.now());
  const { submit, submitting, submitted, error } = useActivitySubmit(activityNumber);

  const assignFeature = (featureId, category) => {
    setAssignments((prev) => {
      // If already assigned to this category, unassign
      if (prev[featureId] === category) {
        const next = { ...prev };
        delete next[featureId];
        return next;
      }
      return { ...prev, [featureId]: category };
    });
  };

  const getFeaturesByCategory = (categoryKey) => {
    return FEATURES.filter((f) => assignments[f.id] === categoryKey);
  };

  const getUnassigned = () => {
    return FEATURES.filter((f) => !assignments[f.id]);
  };

  const allAssigned = Object.keys(assignments).length === FEATURES.length;

  const handleSubmit = () => {
    if (!allAssigned) return;

    // Build categories with labels (matching scoring engine expectations)
    const categories = { ship: [], reconsider: [], cut: [] };
    for (const feature of FEATURES) {
      const cat = assignments[feature.id];
      if (cat) {
        categories[cat].push(feature.label);
      }
    }

    submit({
      response_data: { categories },
      duration_ms: Date.now() - startTime.current,
    });
  };

  const unassigned = getUnassigned();

  return (
    <motion.div
      className="activity-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="container">
        <div className="activity-header">
          <span className="activity-badge">Activity {activityNumber} of 6</span>
          <h2>{title}</h2>
          <p>
            You're the PM. Launch is in <strong>2 weeks</strong>. Decide what
            to <strong style={{ color: 'var(--color-success)' }}>ship</strong>,
            what to <strong style={{ color: 'var(--color-warning)' }}>reconsider</strong>,
            and what to <strong style={{ color: 'var(--color-error)' }}>cut</strong>.
          </p>
          <div style={{ marginTop: 'var(--space-3)', color: 'var(--color-accent-2)', fontSize: 'var(--font-size-sm)' }}>
            {Object.keys(assignments).length} of {FEATURES.length} features sorted
          </div>
        </div>

        <div className="activity-content">
          {/* Unassigned pool */}
          <AnimatePresence>
            {unassigned.length > 0 && (
              <motion.div
                className="unassigned-pool"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
                  📋 Unsorted Features
                </h4>
                <div className="feature-pool">
                  {unassigned.map((feature) => (
                    <motion.div
                      key={feature.id}
                      className="feature-card-triage"
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      <div className="feature-card-header">
                        <span className="feature-card-icon">{feature.icon}</span>
                        <div>
                          <strong>{feature.label}</strong>
                          <p className="feature-card-desc">{feature.desc}</p>
                        </div>
                      </div>
                      <div className="feature-card-actions">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.key}
                            className={`triage-btn triage-btn-${cat.key}`}
                            onClick={() => assignFeature(feature.id, cat.key)}
                          >
                            {cat.key === 'ship' ? '🚀' : cat.key === 'reconsider' ? '⚠️' : '✂️'}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Triage columns */}
          <div className="triage-columns">
            {CATEGORIES.map((cat) => {
              const features = getFeaturesByCategory(cat.key);
              return (
                <div key={cat.key} className={`triage-column ${cat.className}`}>
                  <div className="column-header">
                    {cat.label}
                    <span className="column-count">{features.length}</span>
                  </div>
                  <p className="column-desc">{cat.desc}</p>
                  <div className="column-items">
                    <AnimatePresence>
                      {features.map((feature) => (
                        <motion.div
                          key={feature.id}
                          className="feature-card"
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                          <div className="flex items-center gap-2" style={{ justifyContent: 'space-between' }}>
                            <span>
                              {feature.icon} {feature.label}
                            </span>
                            <button
                              className="remove-btn"
                              onClick={() => assignFeature(feature.id, cat.key)}
                              title="Remove from category"
                            >
                              ✕
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {features.length === 0 && (
                      <div className="column-empty">
                        Drop features here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="activity-footer">
          {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>{error}</p>}
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={submitting || submitted || !allAssigned}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitted
              ? '✓ Submitted!'
              : submitting
              ? 'Submitting…'
              : allAssigned
              ? 'Ship It! →'
              : `Sort all features (${Object.keys(assignments).length}/${FEATURES.length})`}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
