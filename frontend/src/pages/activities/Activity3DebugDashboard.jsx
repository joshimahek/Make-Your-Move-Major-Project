/**
 * Activity 3: Live Debug Dashboard
 * Click on diagnostic panels to "pin" them — order tracked as behavioral signal.
 * Panel investigated first determines domain scoring.
 * Tracks: pin_order [{ panel, timestamp }]
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivitySubmit } from '../../api/useActivitySubmit';
import './Activities.css';

const PANELS = [
  {
    id: 'db_log',
    title: 'Database Query Log',
    icon: '🗄️',
    data: `SELECT * FROM orders WHERE id=4821;
→ 3200ms (SLOW QUERY)
Rows scanned: 842,000
Index: orders_pkey (not used)
Lock wait: 1800ms`,
  },
  {
    id: 'network_tab',
    title: 'Network Tab',
    icon: '🌐',
    data: `GET /api/orders → 200 (4.2s)
POST /api/checkout → 504 Timeout
GET /static/bundle.js → 200 (12ms)
WS: connected (latency 22ms)
DNS lookup: 180ms`,
  },
  {
    id: 'server_cpu',
    title: 'Server CPU Monitor',
    icon: '📊',
    data: `CPU Usage: 94% ▅▅▅▅▅▇▇█
Memory: 7.2GB / 8GB (90%)
Load Avg: 12.4, 8.7, 6.1
Processes: 847 (32 zombie)
Uptime: 43d 7h 22m`,
  },
  {
    id: 'frontend_render',
    title: 'Frontend Render Profiler',
    icon: '🎨',
    data: `<OrderList> re-renders: 847/min
Largest Contentful Paint: 4.8s
Cumulative Layout Shift: 0.42
Bundle size: 2.4MB (ungzipped)
React DevTools: 12 wasted renders`,
  },
  {
    id: 'deployment_history',
    title: 'Deployment History',
    icon: '🚀',
    data: `v3.4.1 — 2h ago — "Add caching layer"
v3.4.0 — 1d ago — "Migrate to new DB"
v3.3.9 — 3d ago — "Fix checkout flow"
Rollback count (7d): 2
Deploy frequency: 4.2/day`,
  },
];

export default function Activity3DebugDashboard({ activityNumber, title }) {
  const [pinnedPanels, setPinnedPanels] = useState(new Set());
  const pinOrder = useRef([]);
  const startTime = useRef(Date.now());
  const { submit, submitting, submitted, error } = useActivitySubmit(activityNumber);

  const handlePinPanel = (panelId) => {
    if (pinnedPanels.has(panelId)) return;

    setPinnedPanels((prev) => new Set([...prev, panelId]));
    pinOrder.current.push({
      panel: panelId,
      timestamp: Date.now() - startTime.current,
    });
  };

  const handleSubmit = () => {
    if (pinOrder.current.length === 0) return;
    submit({
      response_data: { pin_order: pinOrder.current },
      duration_ms: Date.now() - startTime.current,
    });
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
            🔴 <strong>Production is down!</strong> Users are reporting slow checkouts.
            Click the panels below to investigate — start with where you'd look first.
          </p>
          <div style={{ marginTop: 'var(--space-3)', color: 'var(--color-accent-2)' }}>
            {pinnedPanels.size} of {PANELS.length} panels investigated
          </div>
        </div>

        <div className="activity-content">
          <div className="debug-panels">
            {PANELS.map((panel, index) => {
              const isPinned = pinnedPanels.has(panel.id);
              const pinNumber = pinOrder.current.findIndex(
                (p) => p.panel === panel.id
              ) + 1;

              return (
                <motion.div
                  key={panel.id}
                  className={`debug-panel ${isPinned ? 'pinned' : ''}`}
                  onClick={() => handlePinPanel(panel.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={!isPinned ? { scale: 1.02 } : {}}
                  whileTap={!isPinned ? { scale: 0.98 } : {}}
                >
                  {isPinned && (
                    <motion.div
                      className="pin-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      #{pinNumber}
                    </motion.div>
                  )}
                  <div className="panel-title">
                    <span>{panel.icon}</span>
                    <span>{panel.title}</span>
                  </div>
                  <pre className="panel-data">{panel.data}</pre>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="activity-footer">
          {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>{error}</p>}
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={submitting || submitted || pinOrder.current.length === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitted
              ? '✓ Submitted!'
              : submitting
              ? 'Submitting…'
              : `Submit Investigation ${pinnedPanels.size > 0 ? '→' : '(pin at least 1)'}`}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
