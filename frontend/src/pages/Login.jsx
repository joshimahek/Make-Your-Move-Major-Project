import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAssessment } from '../context/AssessmentContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { startSession } = useAssessment();

  // Synchronous re-entrancy guard. `loading` (React state) only takes
  // effect after a re-render, so a fast double-click or double Enter
  // can invoke handleLogin twice before the button actually disables.
  // Two concurrent login POSTs each get their own Set-Cookie for
  // sessionid/csrftoken; whichever lands last in the browser silently
  // wins, leaving the app's belief about "logged in" out of sync with
  // the cookie jar. This ref check is checked BEFORE any state update,
  // so it closes that gap.
  const submittingRef = useRef(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      await startSession();
      navigate('/context');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <motion.div
      className="container flex justify-center items-center"
      style={{ minHeight: '80vh' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        <div className="text-center mb-8">
          <h2 className="gradient-text" style={{ marginBottom: 'var(--space-2)' }}>Welcome Back</h2>
          <p>Sign in to continue your assessment journey.</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            marginBottom: 'var(--space-4)',
            color: '#fca5a5',
            fontSize: 'var(--font-size-sm)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent-1)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent-1)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>

          <motion.button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: 'var(--space-4)', marginTop: 'var(--space-2)' }}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </motion.button>
        </form>

        <div className="text-center mt-8" style={{ fontSize: 'var(--font-size-sm)' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Don't have an account? </span>
          <Link to="/signup" style={{ fontWeight: 600 }}>Create one</Link>
        </div>
      </div>
    </motion.div>
  );
}
