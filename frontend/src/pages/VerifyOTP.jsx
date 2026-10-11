import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const { verifyOTP } = useAuth();
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(
    Number(location.state?.resendAvailableIn) || 0,
  );
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendSeconds((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const handleVerify = async (event) => {
    event.preventDefault();
    if (submitting || otp.length !== 6) return;
    setSubmitting(true);
    setError('');
    setAttemptsRemaining(null);
    try {
      await verifyOTP(email, otp);
      navigate('/context', { replace: true });
    } catch (verificationError) {
      setError(verificationError.message);
      if (typeof verificationError.attemptsRemaining === 'number') {
        setAttemptsRemaining(verificationError.attemptsRemaining);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resending || resendSeconds > 0) return;
    setResending(true);
    setError('');
    setAttemptsRemaining(null);
    try {
      const response = await authAPI.resendOTP(email);
      if (response.data.already_verified) {
        setError('This email is already verified. Please sign in.');
      } else {
        setOtp('');
        setResendSeconds(response.data.resend_available_in || 60);
      }
    } catch (resendError) {
      const data = resendError.response?.data || {};
      setError(data.error || 'Could not resend the verification code. Please try again.');
      if (typeof data.retry_after === 'number') setResendSeconds(data.retry_after);
    } finally {
      setResending(false);
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
          <h2 className="gradient-text" style={{ marginBottom: 'var(--space-2)' }}>
            Verify Your Email
          </h2>
          {email ? (
            <p>Enter the 6-digit code sent to {email}.</p>
          ) : (
            <p>Verification needs the email address from signup or login.</p>
          )}
        </div>

        {!email ? (
          <div className="text-center" style={{ fontSize: 'var(--font-size-sm)' }}>
            <Link to="/login" style={{ fontWeight: 600, marginRight: 'var(--space-4)' }}>
              Return to sign in
            </Link>
            <Link to="/signup" style={{ fontWeight: 600 }}>
              Create account
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div
                role="alert"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-4)',
                  marginBottom: 'var(--space-4)',
                  color: '#fca5a5',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {error}
              </div>
            )}

            {attemptsRemaining !== null && (
              <p role="status" className="text-center" style={{ marginBottom: 'var(--space-4)' }}>
                {attemptsRemaining} verification attempts remaining.
              </p>
            )}

            <form onSubmit={handleVerify} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="otp" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                  Verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  aria-describedby="otp-help"
                  style={{
                    width: '100%',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    outline: 'none',
                  }}
                  onFocus={(event) => (event.target.style.borderColor = 'var(--color-accent-1)')}
                  onBlur={(event) => (event.target.style.borderColor = 'var(--color-border)')}
                />
                <span id="otp-help" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Use the 6-digit code from your email.
                </span>
              </div>

              <motion.button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: 'var(--space-4)' }}
                disabled={submitting || otp.length !== 6}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {submitting ? 'Verifying...' : 'Verify Email'}
              </motion.button>
            </form>

            <div className="text-center mt-8" style={{ fontSize: 'var(--font-size-sm)' }}>
              <button
                type="button"
                className="btn"
                onClick={handleResend}
                disabled={resending || resendSeconds > 0}
              >
                {resending
                  ? 'Sending...'
                  : resendSeconds > 0
                    ? `Resend code in ${resendSeconds}s`
                    : 'Resend verification code'}
              </button>
            </div>
            <div className="text-center mt-4" style={{ fontSize: 'var(--font-size-sm)' }}>
              <Link to="/login">Back to sign in</Link>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}