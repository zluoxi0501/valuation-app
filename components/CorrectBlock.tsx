'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { track } from '@/lib/tracking';

interface CorrectBlockProps {
  step: string;
  onConfirm: () => void;
  onRefine: (correction: string) => void;
}

const CONFIRM_OPTIONS = [
  { label: '对', value: 'correct' },
  { label: '不完全对', value: 'partial' },
  { label: '不是这个意思', value: 'wrong' },
];

export default function CorrectBlock({ step, onConfirm, onRefine }: CorrectBlockProps) {
  const [status, setStatus] = useState<'ask' | 'input' | 'done'>('ask');
  const [correction, setCorrection] = useState('');

  const handleSelect = (value: string) => {
    track('understanding_check', { current_step: step, selected_feeling: value });

    if (value === 'correct') {
      setStatus('done');
      onConfirm();
    } else {
      setStatus('input');
    }
  };

  const handleSubmit = () => {
    if (!correction.trim()) return;
    track('user_correction', { current_step: step, feedback_text: correction.trim() });
    setStatus('done');
    onRefine(correction.trim());
  };

  return (
    <AnimatePresence mode="wait">
      {status === 'ask' && (
        <motion.div
          key="ask"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ marginTop: '48px' }}
        >
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              lineHeight: 1.7,
            }}
          >
            我理解对了吗？
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {CONFIRM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  padding: '11px 18px',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  backgroundColor: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {status === 'input' && (
        <motion.div
          key="input"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginTop: '48px' }}
        >
          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              marginBottom: '14px',
              lineHeight: 1.7,
            }}
          >
            你愿意补充一点吗？
          </p>
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            rows={3}
            autoFocus
            placeholder="比如：其实我更担心的是…"
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--text-primary)',
              backgroundColor: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              marginBottom: '14px',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
          />
          <button
            onClick={handleSubmit}
            disabled={!correction.trim()}
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              color: correction.trim() ? '#fff' : 'var(--text-muted)',
              backgroundColor: correction.trim() ? 'var(--accent)' : 'var(--bg-secondary)',
              border: 'none',
              borderRadius: '4px',
              cursor: correction.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'background-color 0.2s',
            }}
          >
            继续聊
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
