/**
 * Activity Router — routes to the correct activity component based on URL param.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Activity1SystemFlow from './Activity1SystemFlow';
import Activity2MessyUI from './Activity2MessyUI';
import Activity3DebugDashboard from './Activity3DebugDashboard';
import Activity4Architecture from './Activity4Architecture';
import Activity5ThreatSpotter from './Activity5ThreatSpotter';
import Activity6FeatureTriage from './Activity6FeatureTriage';

const ACTIVITY_COMPONENTS = {
  1: Activity1SystemFlow,
  2: Activity2MessyUI,
  3: Activity3DebugDashboard,
  4: Activity4Architecture,
  5: Activity5ThreatSpotter,
  6: Activity6FeatureTriage,
};

const ACTIVITY_TITLES = {
  1: 'System Flow Arrangement',
  2: 'Messy UI Fix',
  3: 'Live Debug Dashboard',
  4: 'Architecture Builder',
  5: 'Threat Spotter',
  6: 'Feature Triage',
};

export default function ActivityRouter() {
  const { activityNumber } = useParams();
  const navigate = useNavigate();
  const num = parseInt(activityNumber, 10);

  useEffect(() => {
    if (!ACTIVITY_COMPONENTS[num]) {
      navigate('/');
    }
  }, [num, navigate]);

  const Component = ACTIVITY_COMPONENTS[num];
  if (!Component) return null;

  return <Component activityNumber={num} title={ACTIVITY_TITLES[num]} />;
}
