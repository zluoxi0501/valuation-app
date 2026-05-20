'use client';

import { motion } from 'framer-motion';

interface ContinueButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export default function ContinueButton({
  onClick,
  disabled = false,
  label = '继续',
}: ContinueButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { backgroundColor: '#1e2d50' }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      style={{
        backgroundColor: disabled ? 'var(--text-muted)' : 'var(--accent)',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '14px 36px',
        fontSize: '15px',
        letterSpacing: '0.02em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        transition: 'background-color 0.2s',
      }}
    >
      {label}
    </motion.button>
  );
}
