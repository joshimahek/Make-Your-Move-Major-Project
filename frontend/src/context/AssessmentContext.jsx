/**
 * Assessment context — manages session state across the app.
 * Hydrates from the backend session on first load so page refreshes
 * don't lose progress.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { sessionAPI } from '../api/client';

const AssessmentContext = createContext(null);

export function AssessmentProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activityOrder, setActivityOrder] = useState([1, 2, 3, 4, 5, 6]);
  const [completedActivities, setCompletedActivities] = useState(new Set());
  const [hydrated, setHydrated] = useState(false);

  // On mount: attempt to rehydrate from an existing backend session
  useEffect(() => {
    const hydrate = async () => {
      try {
        const res = await sessionAPI.get();
        const s = res.data;
        setSession(s);

        // Rebuild activity order if context was already submitted
        if (s.current_stage !== 'context_intake') {
          // Experienced users get architecture-first order
          if (['year_3', 'year_4_plus', 'professional'].includes(s.year_of_study)) {
            setActivityOrder([4, 1, 3, 2, 5, 6]);
          }
        }

        // Restore completed activities using the exact list from the backend
        if (s.completed_activity_numbers && s.completed_activity_numbers.length > 0) {
          setCompletedActivities(new Set(s.completed_activity_numbers));
        }
      } catch {
        // No existing session — that's fine, user starts fresh
      } finally {
        setHydrated(true);
      }
    };
    hydrate();
  }, []);

  const startSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionAPI.start();
      setSession(res.data);
      // Reset progress tracking for the fresh session
      setCompletedActivities(new Set());
      setActivityOrder([1, 2, 3, 4, 5, 6]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const res = await sessionAPI.get();
      setSession(res.data);
      return res.data;
    } catch {
      // No session — that's okay
      return null;
    }
  }, []);

  const submitContext = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await sessionAPI.submitContext(data);
      if (res.data.activity_order) {
        setActivityOrder(res.data.activity_order);
      }
      setSession(prev => ({
        ...prev,
        current_stage: res.data.current_stage,
      }));
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save context');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markActivityComplete = useCallback((activityNumber) => {
    setCompletedActivities(prev => new Set([...prev, activityNumber]));
  }, []);

  const resetSession = useCallback(async () => {
    try {
      await sessionAPI.reset();
      setSession(null);
      setCompletedActivities(new Set());
      setActivityOrder([1, 2, 3, 4, 5, 6]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset');
    }
  }, []);

  const getNextActivity = useCallback(() => {
    for (const actNum of activityOrder) {
      if (!completedActivities.has(actNum)) {
        return actNum;
      }
    }
    return null; // All complete
  }, [activityOrder, completedActivities]);

  const value = {
    session,
    loading,
    error,
    hydrated,
    activityOrder,
    completedActivities,
    startSession,
    fetchSession,
    submitContext,
    markActivityComplete,
    resetSession,
    getNextActivity,
    setSession,
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within AssessmentProvider');
  }
  return context;
}
