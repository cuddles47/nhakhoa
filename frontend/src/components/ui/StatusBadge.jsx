import './StatusBadge.css';

/**
 * StatusBadge Component
 * Shows status with color-coded badges
 */
const StatusBadge = ({ status, label, variant = 'default' }) => {
  const getStatusClass = () => {
    // Visit status
    if (status === 'pending') return 'badge-warning';
    if (status === 'in_progress') return 'badge-info';
    if (status === 'completed') return 'badge-success';
    if (status === 'cancelled') return 'badge-danger';
    
    // Validation status
    if (status === 'valid') return 'badge-success';
    if (status === 'invalid') return 'badge-danger';
    
    // Generic variants
    if (variant === 'success') return 'badge-success';
    if (variant === 'warning') return 'badge-warning';
    if (variant === 'danger') return 'badge-danger';
    if (variant === 'info') return 'badge-info';
    
    return 'badge-default';
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {label || status}
    </span>
  );
};

export default StatusBadge;
