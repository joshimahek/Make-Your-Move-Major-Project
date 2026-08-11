import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssessment } from '../context/AssessmentContext';
import './ContextIntake.css';

const QUESTIONS = [
  {
    key: 'year_of_study',
    title: 'What year are you in?',
    subtitle: 'This helps us tailor the difficulty and order of your activities.',
    options: [
      { value: 'year_1', label: 'Year 1', icon: '🌱', desc: 'Just getting started' },
      { value: 'year_2', label: 'Year 2', icon: '📚', desc: 'Building foundations' },
      { value: 'year_3', label: 'Year 3', icon: '⚡', desc: 'Getting hands-on' },
      { value: 'year_4_plus', label: 'Year 4+', icon: '🎓', desc: 'Almost there' },
      { value: 'professional', label: 'Professional', icon: '💼', desc: 'Already working' },
    ],
  },
  {
    key: 'prior_experience',
    title: 'What\'s your hands-on experience?',
    subtitle: 'We adjust thresholds to prevent confirmation bias.',
    options: [
      { value: 'never', label: 'Never coded', icon: '🆕', desc: 'Completely fresh' },
      { value: 'dabbled', label: 'Dabbled a bit', icon: '🔧', desc: 'Tried tutorials or small projects' },
      { value: 'built_something', label: 'Built something', icon: '🚀', desc: 'Shipped a project or contributed to one' },
    ],
  },
  {
    key: 'goal',
    title: 'What\'s your goal?',
    subtitle: 'This shapes how we present your results.',
    options: [
      { value: 'exploring', label: 'No idea yet', icon: '🧭', desc: 'Open to anything' },
      { value: 'narrowing', label: 'Narrowing down', icon: '🔍', desc: 'Have some ideas, need clarity' },
      { value: 'validating', label: 'Validating a hunch', icon: '✅', desc: 'Think I know, want confirmation' },
    ],
  },
];

export default function ContextIntake() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();
  const { submitContext, loading } = useAssessment();

  const question = QUESTIONS[currentQ];
  const isLast = currentQ === QUESTIONS.length - 1;
  const selectedValue = answers[question.key];

  const submittingRef = useRef(false);

  const handleSelect = (value) => {
    setAnswers(prev => ({ ...prev, [question.key]: value }));
  };

  const handleNext = async () => {
    if (!selectedValue) return;
    if (isLast) {
      if (submittingRef.current) return;
      submittingRef.current = true;
      try {
        const result = await submitContext(answers);
        const firstActivity = result.activity_order?.[0] || 1;
        navigate(`/activity/${firstActivity}`);
      } catch (err) {
        console.error('Context submit failed:', err);
      } finally {
        submittingRef.current = false;
      }
    } else {
      setCurrentQ(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ(prev => prev - 1);
  };

  return (
    <div className="context-intake container container-sm">
      <div className="question-counter">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`counter-dot ${i === currentQ ? 'active' : ''} ${i < currentQ ? 'done' : ''}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          className="question-card"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="question-title">{question.title}</h2>
          <p className="question-subtitle">{question.subtitle}</p>

          <div className="options-grid">
            {question.options.map((opt) => (
              <motion.button
                key={opt.value}
                className={`option-card glass-card ${selectedValue === opt.value ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="option-icon">{opt.icon}</span>
                <span className="option-label">{opt.label}</span>
                <span className="option-desc">{opt.desc}</span>
                {selectedValue === opt.value && (
                  <motion.div
                    className="option-check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="question-nav">
        {currentQ > 0 && (
          <button className="btn btn-secondary" onClick={handleBack}>
            ← Back
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!selectedValue || loading}
        >
          {loading ? 'Saving...' : isLast ? 'Start Activities →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
