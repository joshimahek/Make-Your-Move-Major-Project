/**
 * App Layout — shell with progress bar for assessment stages.
 */
import { useAssessment } from '../context/AssessmentContext';
import './Layout.css';

const STAGES = [
  { key: 'context_intake', label: 'Context' },
  { key: 'pre_assessment', label: 'Activities' },
  { key: 'thinking_styles', label: 'Thinking Styles' },
  { key: 'results', label: 'Results' },
];

export default function Layout({ children }) {
  const { session } = useAssessment();

  const currentStage = session?.current_stage || 'context_intake';
  // 'validation' maps to the thinking_styles slot in our 4-step UI
  const uiStage = currentStage === 'validation' ? 'thinking_styles' : currentStage;
  const currentIdx = STAGES.findIndex(s => s.key === uiStage);
  const progress = Math.max(0, ((currentIdx + 1) / STAGES.length) * 100);

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="container">
          <div className="header-content">
            <a href="/" className="logo">
              <span className="logo-icon">🎯</span>
              <span className="logo-text gradient-text">Make Your Move</span>
            </a>
            <div className="progress-section">
              <div className="progress-stages">
                {STAGES.map((stage, i) => (
                  <span
                    key={stage.key}
                    className={`stage-dot ${i <= currentIdx ? 'active' : ''} ${i === currentIdx ? 'current' : ''}`}
                    title={stage.label}
                  >
                    <span className="stage-label">{stage.label}</span>
                  </span>
                ))}
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}
