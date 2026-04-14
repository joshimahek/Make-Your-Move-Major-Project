/**
 * Activity 5: Threat Spotter
 * Spot vulnerabilities in a login page mockup by clicking on suspicious zones.
 * Tracks: flag_order [{ vulnerability, timestamp }], time_to_first_flag_ms
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivitySubmit } from '../../api/useActivitySubmit';
import './Activities.css';

const VULNERABILITIES = [
  {
    id: 'session_token_url',
    label: 'Session Token in URL',
    hint: 'The URL bar is exposing sensitive data…',
  },
  {
    id: 'plain_text_password',
    label: 'Plain Text Password',
    hint: "Something's wrong with how the password is being shown…",
  },
  {
    id: 'no_rate_limit',
    label: 'No Rate Limiting',
    hint: 'What happens if someone tries thousands of passwords?',
  },
  {
    id: 'missing_captcha',
    label: 'Missing CAPTCHA',
    hint: 'Nothing stops a bot from submitting this form…',
  },
];

export default function Activity5ThreatSpotter({ activityNumber, title }) {
  const [flagged, setFlagged] = useState(new Set());
  const [elapsed, setElapsed] = useState(0);
  const flagOrder = useRef([]);
  const startTime = useRef(Date.now());
  const firstFlagTime = useRef(null);
  const { submit, submitting, submitted, error } = useActivitySubmit(activityNumber);

  // Running timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFlag = (vulnId) => {
    if (flagged.has(vulnId)) {
      // Unflag
      setFlagged((prev) => {
        const next = new Set(prev);
        next.delete(vulnId);
        return next;
      });
      flagOrder.current = flagOrder.current.filter((f) => f.vulnerability !== vulnId);
      return;
    }

    // Flag
    const now = Date.now();
    if (!firstFlagTime.current) {
      firstFlagTime.current = now - startTime.current;
    }

    setFlagged((prev) => new Set([...prev, vulnId]));
    flagOrder.current.push({
      vulnerability: vulnId,
      timestamp: now - startTime.current,
    });
  };

  const handleSubmit = () => {
    if (flagOrder.current.length === 0) return;
    submit({
      response_data: {
        flag_order: flagOrder.current,
        time_to_first_flag_ms: firstFlagTime.current || 0,
      },
      duration_ms: Date.now() - startTime.current,
    });
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            Below is a login page. Some things aren't quite right.
            <strong> Click on everything that looks like a security vulnerability.</strong>
          </p>
          <div className="timer-display">⏱ {formatTime(elapsed)}</div>
          <div style={{ color: 'var(--color-accent-2)', fontSize: 'var(--font-size-sm)' }}>
            {flagged.size} {flagged.size === 1 ? 'vulnerability' : 'vulnerabilities'} flagged
          </div>
        </div>

        <div className="activity-content">
          <div className="login-mockup">
            {/* Fake browser chrome */}
            <div className="mockup-browser-bar">
              <div className="browser-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              {/* Vulnerability: session token in URL */}
              <motion.div
                className={`vulnerability-zone url-zone ${flagged.has('session_token_url') ? 'flagged' : ''}`}
                onClick={() => handleFlag('session_token_url')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="url-text">
                  🔓 https://app.example.com/login<span className="url-suspicious">?token=eyJhbGci...x4kQ&session=usr_38291</span>
                </span>
                <AnimatePresence>
                  {flagged.has('session_token_url') && (
                    <motion.span
                      className="flag-icon"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      🚩
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Login form body */}
            <div className="mockup-body">
              <div className="mockup-logo">🔐</div>
              <h3 className="mockup-title">Welcome Back</h3>
              <p className="mockup-subtitle">Sign in to your account</p>

              {/* Email field — normal */}
              <div className="mockup-field">
                <label>Email</label>
                <div className="mockup-input">user@example.com</div>
              </div>

              {/* Vulnerability: password visible in plain text */}
              <motion.div
                className={`vulnerability-zone ${flagged.has('plain_text_password') ? 'flagged' : ''}`}
                onClick={() => handleFlag('plain_text_password')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="mockup-field">
                  <label>Password</label>
                  <div className="mockup-input password-visible">
                    MyS3cretP@ss!
                    <span className="field-note">type="text"</span>
                  </div>
                </div>
                <AnimatePresence>
                  {flagged.has('plain_text_password') && (
                    <motion.span
                      className="flag-icon"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      🚩
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Vulnerability: no rate limiting message */}
              <motion.div
                className={`vulnerability-zone ${flagged.has('no_rate_limit') ? 'flagged' : ''}`}
                onClick={() => handleFlag('no_rate_limit')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="login-attempts">
                  <span className="attempts-icon">⚠️</span>
                  <span className="attempts-text">
                    Failed login attempt #47 — <em>no limit enforced</em>
                  </span>
                </div>
                <AnimatePresence>
                  {flagged.has('no_rate_limit') && (
                    <motion.span
                      className="flag-icon"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      🚩
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Vulnerability: no CAPTCHA */}
              <motion.div
                className={`vulnerability-zone ${flagged.has('missing_captcha') ? 'flagged' : ''}`}
                onClick={() => handleFlag('missing_captcha')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="mockup-submit-area">
                  <div className="mockup-btn">Sign In</div>
                  <span className="captcha-missing">
                    No CAPTCHA • No bot protection
                  </span>
                </div>
                <AnimatePresence>
                  {flagged.has('missing_captcha') && (
                    <motion.span
                      className="flag-icon"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      🚩
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Hint/Legend */}
          <motion.div
            className="threat-legend"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 'var(--space-6)' }}>
              💡 Click on any suspicious element to flag it. Look for things that shouldn't be visible,
              missing protections, and data leaks.
            </p>
          </motion.div>
        </div>

        <div className="activity-footer">
          {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>{error}</p>}
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={submitting || submitted || flagged.size === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitted
              ? '✓ Submitted!'
              : submitting
              ? 'Submitting…'
              : `Submit Report (${flagged.size} flagged) →`}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
