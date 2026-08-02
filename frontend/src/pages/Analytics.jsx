/**
 * Analytics Dashboard — admin-only page showing aggregate assessment metrics.
 * Uses Chart.js for visualizations.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, RadialLinearScale, Filler,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut, Radar, Line } from 'react-chartjs-2';
import { analyticsAPI } from '../api/client';
import './Analytics.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, RadialLinearScale, Filler,
  Title, Tooltip, Legend,
);

// Shared chart options for dark theme
const DARK_GRID = { color: 'rgba(255,255,255,0.06)' };
const DARK_TICKS = { color: 'rgba(255,255,255,0.5)' };
const DARK_LEGEND = { labels: { color: 'rgba(255,255,255,0.7)', font: { size: 12 } } };

// Domain display names
const DOMAIN_LABELS = {
  backend: 'Backend',
  frontend: 'Frontend',
  devops: 'DevOps',
  data_eng: 'Data Eng',
  ai_ml: 'AI/ML',
  cybersecurity: 'Security',
  product_eng: 'Product',
};

// Thinking style display names
const STYLE_LABELS = {
  experience_shaper: 'Experience Shaper',
  problem_definer: 'Problem Definer',
  systems_thinker: 'Systems Thinker',
  reliability_keeper: 'Reliability Keeper',
  signal_seeker: 'Signal Seeker',
  hypothesis_tester: 'Hypothesis Tester',
  threat_anticipator: 'Threat Anticipator',
  trust_architect: 'Trust Architect',
};

// Stage display names
const STAGE_LABELS = {
  context_intake: 'Context Intake',
  pre_assessment: 'Pre-Assessment',
  thinking_styles: 'Thinking Styles',
  validation: 'Validation',
  results: 'Results',
  completed: 'Completed',
};

// Color palette
const COLORS = [
  '#818cf8', '#a78bfa', '#c084fc', '#f472b6',
  '#fb7185', '#fbbf24', '#34d399',
];
const COLORS_ALPHA = COLORS.map(c => c + '33');

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsAPI.get();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner" />
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
          Loading analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-empty">
        <div className="empty-icon">⚠️</div>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  const { overview, funnel, domain_distribution, top_domains, thinking_styles,
    activity_times, engagement, deep_dive, demographics, sessions_over_time } = data;

  const formatDuration = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <motion.div
      className="analytics-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="analytics-header">
        <h1 className="gradient-text">📊 Analytics Dashboard</h1>
        <p>Aggregate insights from all assessment sessions</p>
      </div>

      {/* Overview Stats */}
      <div className="stats-row">
        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-value accent-1">{overview.total_users}</div>
          <div className="stat-label">Registered Users</div>
        </motion.div>
        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-value accent-2">{overview.total_sessions}</div>
          <div className="stat-label">Total Sessions</div>
        </motion.div>
        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="stat-value accent-3">{overview.completion_rate}%</div>
          <div className="stat-label">Completion Rate</div>
        </motion.div>
        <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="stat-value accent-4">{formatDuration(overview.avg_total_duration_ms)}</div>
          <div className="stat-label">Avg. Time Spent</div>
        </motion.div>
      </div>

      {overview.total_sessions === 0 ? (
        <div className="analytics-empty">
          <div className="empty-icon">🔬</div>
          <h2>No Data Yet</h2>
          <p>Start testing with users to see analytics appear here.</p>
        </div>
      ) : (
        <div className="charts-grid">

          {/* ── Completion Funnel ── */}
          <div className="chart-card full-width">
            <h3><span className="chart-icon">🔄</span> Completion Funnel</h3>
            <div className="funnel-bar-group">
              {funnel.map((item, i) => {
                const pct = overview.total_sessions > 0
                  ? Math.round((item.count / overview.total_sessions) * 100)
                  : 0;
                return (
                  <div className="funnel-item" key={item.stage}>
                    <span className="funnel-label">{STAGE_LABELS[item.stage] || item.stage}</span>
                    <div className="funnel-track">
                      <motion.div
                        className={`funnel-fill stage-${i}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.1, duration: 0.8, ease: 'easeOut' }}
                      >
                        {pct}%
                      </motion.div>
                    </div>
                    <span className="funnel-count">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Domain Distribution (Radar) ── */}
          <div className="chart-card">
            <h3><span className="chart-icon">🎯</span> Domain Distribution</h3>
            <div className="chart-container">
              <Radar
                data={{
                  labels: Object.keys(domain_distribution).map(k => DOMAIN_LABELS[k] || k),
                  datasets: [{
                    label: 'Avg Score',
                    data: Object.values(domain_distribution),
                    backgroundColor: 'rgba(129, 140, 248, 0.2)',
                    borderColor: '#818cf8',
                    borderWidth: 2,
                    pointBackgroundColor: '#818cf8',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    r: {
                      grid: DARK_GRID,
                      angleLines: { color: 'rgba(255,255,255,0.06)' },
                      ticks: { ...DARK_TICKS, backdropColor: 'transparent' },
                      pointLabels: { color: 'rgba(255,255,255,0.7)', font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* ── Top Domain Leaderboard ── */}
          <div className="chart-card">
            <h3><span className="chart-icon">🏆</span> Top Domain Rankings</h3>
            <div className="chart-container">
              <Bar
                data={{
                  labels: top_domains.map(d => DOMAIN_LABELS[d.domain] || d.domain),
                  datasets: [{
                    label: '# Users',
                    data: top_domains.map(d => d.count),
                    backgroundColor: COLORS.slice(0, top_domains.length),
                    borderRadius: 6,
                    borderSkipped: false,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: DARK_GRID, ticks: DARK_TICKS },
                    y: { grid: { display: false }, ticks: { ...DARK_TICKS, font: { size: 12 } } },
                  },
                }}
              />
            </div>
          </div>

          {/* ── Thinking Styles ── */}
          <div className="chart-card">
            <h3><span className="chart-icon">🧠</span> Thinking Styles</h3>
            <div className="chart-container">
              <Bar
                data={{
                  labels: thinking_styles.map(s => STYLE_LABELS[s.style] || s.style),
                  datasets: [{
                    label: 'Frequency',
                    data: thinking_styles.map(s => s.count),
                    backgroundColor: COLORS.slice(0, thinking_styles.length).map(c => c + '99'),
                    borderColor: COLORS.slice(0, thinking_styles.length),
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: DARK_GRID, ticks: DARK_TICKS },
                    y: { grid: { display: false }, ticks: { ...DARK_TICKS, font: { size: 11 } } },
                  },
                }}
              />
            </div>
          </div>

          {/* ── Time per Activity ── */}
          <div className="chart-card">
            <h3><span className="chart-icon">⏱️</span> Avg Time per Activity</h3>
            <div className="chart-container">
              <Bar
                data={{
                  labels: activity_times.map(a => `Activity ${a.activity_number}`),
                  datasets: [{
                    label: 'Avg Duration (s)',
                    data: activity_times.map(a => Math.round((a.avg_duration || 0) / 1000)),
                    backgroundColor: 'rgba(167, 139, 250, 0.5)',
                    borderColor: '#a78bfa',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: DARK_TICKS },
                    y: { grid: DARK_GRID, ticks: DARK_TICKS },
                  },
                }}
              />
            </div>
          </div>

          {/* ── Engagement Quality ── */}
          <div className="chart-card">
            <h3><span className="chart-icon">🔥</span> Validation Engagement</h3>
            <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {Object.keys(engagement).length > 0 ? (
                <Doughnut
                  data={{
                    labels: Object.keys(engagement).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
                    datasets: [{
                      data: Object.values(engagement),
                      backgroundColor: ['#34d399', '#818cf8', '#fbbf24', '#fb7185', '#6b7280'],
                      borderWidth: 0,
                      hoverOffset: 8,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                      legend: { ...DARK_LEGEND, position: 'bottom' },
                    },
                  }}
                />
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>No validation data yet</p>
              )}
            </div>
          </div>

          {/* ── Deep-Dive Usage ── */}
          <div className="chart-card">
            <h3><span className="chart-icon">💬</span> Deep-Dive Chat Usage</h3>
            <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {Object.keys(deep_dive).length > 0 ? (
                <Doughnut
                  data={{
                    labels: Object.keys(deep_dive).map(k => k.charAt(0).toUpperCase() + k.slice(1).replace('_', ' ')),
                    datasets: [{
                      data: Object.values(deep_dive),
                      backgroundColor: ['#34d399', '#818cf8', '#fb7185', '#fbbf24'],
                      borderWidth: 0,
                      hoverOffset: 8,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                      legend: { ...DARK_LEGEND, position: 'bottom' },
                    },
                  }}
                />
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>No deep-dive data yet</p>
              )}
            </div>
          </div>

          {/* ── Sessions Over Time ── */}
          <div className="chart-card full-width">
            <h3><span className="chart-icon">📈</span> Sessions Over Time (Last 30 Days)</h3>
            <div className="chart-container">
              {sessions_over_time.length > 0 ? (
                <Line
                  data={{
                    labels: sessions_over_time.map(s => {
                      const d = new Date(s.date);
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }),
                    datasets: [{
                      label: 'Sessions',
                      data: sessions_over_time.map(s => s.count),
                      fill: true,
                      backgroundColor: 'rgba(129, 140, 248, 0.15)',
                      borderColor: '#818cf8',
                      borderWidth: 2,
                      tension: 0.4,
                      pointBackgroundColor: '#818cf8',
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: DARK_GRID, ticks: DARK_TICKS },
                      y: { grid: DARK_GRID, ticks: { ...DARK_TICKS, stepSize: 1 }, beginAtZero: true },
                    },
                  }}
                />
              ) : (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', paddingTop: 'var(--space-8)' }}>
                  No session data in the last 30 days
                </p>
              )}
            </div>
          </div>

          {/* ── User Demographics ── */}
          <div className="chart-card full-width">
            <h3><span className="chart-icon">👥</span> User Demographics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)' }}>
              {/* Year of Study */}
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                  Year of Study
                </h4>
                <div className="demo-grid">
                  {Object.entries(demographics.year_of_study || {}).map(([key, count]) => (
                    <div className="demo-item" key={key}>
                      <div className="demo-value">{count}</div>
                      <div className="demo-label">{key.replace(/_/g, ' ')}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Experience */}
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                  Prior Experience
                </h4>
                <div className="demo-grid">
                  {Object.entries(demographics.prior_experience || {}).map(([key, count]) => (
                    <div className="demo-item" key={key}>
                      <div className="demo-value">{count}</div>
                      <div className="demo-label">{key.replace(/_/g, ' ')}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Goals */}
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                  Goals
                </h4>
                <div className="demo-grid">
                  {Object.entries(demographics.goal || {}).map(([key, count]) => (
                    <div className="demo-item" key={key}>
                      <div className="demo-value">{count}</div>
                      <div className="demo-label">{key.replace(/_/g, ' ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
}
