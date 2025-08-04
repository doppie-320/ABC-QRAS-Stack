import { useNavigate } from 'react-router-dom';
import React from 'react';

interface StepButtonProps {
  to: string;
  label: string;
  backgroundColor?: string;
  // Accepts any React component that takes props like width, height, etc.
  icon?: React.ComponentType<Record<string, unknown>>;
}

const StepButton: React.FC<StepButtonProps> = ({ to, label, icon: Icon, backgroundColor = 'transparent', }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      style={{
        border: '2px solid white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: backgroundColor,
        color: 'white',
        cursor: 'pointer'
      }}
    >
      <p style={{ margin: 0 }}>{label}</p>
      {Icon && <Icon color="#ffffff" width="25%" />}
    </button>
  );
};

export default StepButton;
