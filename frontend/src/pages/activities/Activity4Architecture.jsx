/**
 * Activity 4: Architecture Builder
 * Select from 9 architecture tiles to handle "1 million users" scenario.
 * Tracks: selection_order [{ tile, timestamp }]
 */
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useActivitySubmit } from '../../api/useActivitySubmit';
import './Activities.css';

const TILES = [
  { id: 'load-balancer', label: 'Load Balancer', icon: '⚖️', desc: 'Distribute traffic across servers' },
  { id: 'database', label: 'Database', icon: '🗄️', desc: 'Primary data storage (PostgreSQL)' },
  { id: 'redis', label: 'Redis', icon: '⚡', desc: 'In-memory cache for fast reads' },
  { id: 'cdn', label: 'CDN', icon: '🌍', desc: 'Edge caching for static assets' },
  { id: 'docker', label: 'Docker', icon: '🐳', desc: 'Containerized microservices' },
  { id: 'monitoring', label: 'Monitoring', icon: '📈', desc: 'Real-time metrics & alerting' },
  { id: 'firewall', label: 'Firewall', icon: '🛡️', desc: 'WAF + DDoS protection' },
  { id: 'ml-model', label: 'ML Model', icon: '🤖', desc: 'Recommendation engine' },
  { id: 'message-queue', label: 'Message Queue', icon: '📨', desc: 'Async task processing (RabbitMQ)' },
];

export default function Activity4Architecture({ activityNumber, title }) {
  const [selectedTiles, setSelectedTiles] = useState(new Set());
  const selectionOrder = useRef([]);
  const startTime = useRef(Date.now());
  const { submit, submitting, submitted, error } = useActivitySubmit(activityNumber);

  const handleTileClick = (tileId, tileLabel) => {
    if (selectedTiles.has(tileId)) {
      // Deselect
      setSelectedTiles((prev) => {
        const next = new Set(prev);
        next.delete(tileId);
        return next;
      });
      selectionOrder.current = selectionOrder.current.filter(
        (s) => s.tile !== tileLabel
      );
    } else {
      // Select
      setSelectedTiles((prev) => new Set([...prev, tileId]));
      selectionOrder.current.push({
        tile: tileLabel,
        timestamp: Date.now() - startTime.current,
      });
    }
  };

  const handleSubmit = () => {
    if (selectionOrder.current.length === 0) return;
    submit({
      response_data: { selection_order: selectionOrder.current },
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
            Your app just hit <strong>1 million users</strong>. Select the architecture
            components you'd prioritize to keep it running. Choose in order of importance!
          </p>
          <div style={{ marginTop: 'var(--space-3)', color: 'var(--color-accent-2)' }}>
            {selectedTiles.size} components selected
          </div>
        </div>

        <div className="activity-content">
          <div className="selection-grid">
            {TILES.map((tile, index) => {
              const isSelected = selectedTiles.has(tile.id);
              const orderNum = selectionOrder.current.findIndex(
                (s) => s.tile === tile.label
              ) + 1;

              return (
                <motion.button
                  key={tile.id}
                  className={`selection-tile ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleTileClick(tile.id, tile.label)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ position: 'relative' }}
                >
                  {isSelected && orderNum > 0 && (
                    <motion.span
                      className="tile-order"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {orderNum}
                    </motion.span>
                  )}
                  <span className="tile-icon">{tile.icon}</span>
                  <span className="tile-label">{tile.label}</span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {tile.desc}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="activity-footer">
          {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>{error}</p>}
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={submitting || submitted || selectedTiles.size === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitted
              ? '✓ Submitted!'
              : submitting
              ? 'Submitting…'
              : `Deploy Architecture ${selectedTiles.size > 0 ? '→' : '(select components)'}`}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
