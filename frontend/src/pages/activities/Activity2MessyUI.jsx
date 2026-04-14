/**
 * Activity 2: Messy UI Fix
 * Drag scrambled registration form elements into the correct layout order.
 * Tracks: final_positions, timing.error_message_ms
 */
import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useActivitySubmit } from '../../api/useActivitySubmit';
import './Activities.css';

const FORM_ELEMENTS = [
  { id: 'submit-btn', label: 'Submit Button', icon: '🔘', display: 'Submit' },
  { id: 'error-msg', label: 'Error Message', icon: '⚠️', display: '"Email is required"' },
  { id: 'email', label: 'Email', icon: '📧', display: 'Email input field' },
  { id: 'page-title', label: 'Page Title', icon: '📝', display: 'Create Account' },
  { id: 'password', label: 'Password', icon: '🔑', display: 'Password input field' },
  { id: 'name', label: 'Full Name', icon: '👤', display: 'Name input field' },
  { id: 'terms', label: 'Terms Checkbox', icon: '☑️', display: 'I agree to Terms' },
];

function SortableFormElement({ id, label, icon, display, isErrorMsg, onInteract }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-item ${isDragging ? 'dragging' : ''}`}
      onPointerDown={() => { if (isErrorMsg && onInteract) onInteract(); }}
      {...attributes}
      {...listeners}
    >
      <span className="drag-handle">⠿</span>
      <span className="item-icon">{icon}</span>
      <div className="item-content">
        <strong>{label}</strong>
        <span style={{
          display: 'block',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)',
          marginTop: '2px',
        }}>
          {display}
        </span>
      </div>
    </div>
  );
}

export default function Activity2MessyUI({ activityNumber, title }) {
  const [elements, setElements] = useState(() =>
    [...FORM_ELEMENTS].sort(() => Math.random() - 0.5)
  );
  const { submit, submitting, submitted, error } = useActivitySubmit(activityNumber);

  // Timing tracking for error message interactions
  const errorMsgStartTime = useRef(null);
  const errorMsgTotalTime = useRef(0);
  const startTime = useRef(Date.now());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleErrorMsgInteract = useCallback(() => {
    if (!errorMsgStartTime.current) {
      errorMsgStartTime.current = Date.now();
    }
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setElements((prev) => {
      const oldIndex = prev.findIndex((e) => e.id === active.id);
      const newIndex = prev.findIndex((e) => e.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });

    // If the error message was being interacted with, track the time
    if (errorMsgStartTime.current) {
      errorMsgTotalTime.current += Date.now() - errorMsgStartTime.current;
      errorMsgStartTime.current = null;
    }
  }, []);

  const handleSubmit = () => {
    if (errorMsgStartTime.current) {
      errorMsgTotalTime.current += Date.now() - errorMsgStartTime.current;
    }
    submit({
      response_data: {
        final_positions: elements.map((e) => ({ label: e.label })),
        timing: { error_message_ms: errorMsgTotalTime.current },
      },
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
            This registration form is a mess! Drag the elements below into the order
            that makes the best user experience.
          </p>
        </div>

        <div className="activity-content">
          {/* Preview card */}
          <div
            className="glass-card"
            style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}
          >
            <h4 style={{ marginBottom: 'var(--space-3)', color: 'var(--color-accent-2)' }}>
              📋 Form Preview
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {elements.map((el, i) => (
                <span
                  key={el.id}
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {i + 1}. {el.display}
                </span>
              ))}
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={elements.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-4">
                {elements.map((el) => (
                  <SortableFormElement
                    key={el.id}
                    {...el}
                    isErrorMsg={el.id === 'error-msg'}
                    onInteract={handleErrorMsgInteract}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="activity-footer">
          {error && <p style={{ color: 'var(--color-error)', marginBottom: 'var(--space-3)', textAlign: 'center' }}>{error}</p>}
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={submitting || submitted}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitted ? '✓ Submitted!' : submitting ? 'Submitting…' : 'Fix This Form →'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
