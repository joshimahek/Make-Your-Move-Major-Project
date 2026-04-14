/**
 * useActivitySubmit — reusable hook for submitting any activity.
 * Handles loading, error, and post-submit navigation automatically.
 *
 * Usage:
 *   const { submit, submitting, submitted, error } = useActivitySubmit(activityNumber);
 *   await submit({ response_data: {...}, duration_ms: ... });
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityAPI } from './client';
import { useAssessment } from '../context/AssessmentContext';

export function useActivitySubmit(activityNumber) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { markActivityComplete, activityOrder, completedActivities } = useAssessment();

  const submit = useCallback(async (payload) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    setError(null);

    try {
      await activityAPI.submit(activityNumber, payload);
      markActivityComplete(activityNumber);
      setSubmitted(true);

      // Compute next activity inline, including the one we just completed,
      // to avoid the stale-closure problem with getNextActivity().
      const justCompleted = new Set([...completedActivities, activityNumber]);
      const next = activityOrder.find((n) => !justCompleted.has(n)) ?? null;

      // Navigate after brief success flash
      setTimeout(() => {
        navigate(next ? `/activity/${next}` : '/thinking-styles');
      }, 600);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        'Submission failed. Check your connection and try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [activityNumber, submitting, submitted, navigate, markActivityComplete, activityOrder, completedActivities]);

  return { submit, submitting, submitted, error };
}
