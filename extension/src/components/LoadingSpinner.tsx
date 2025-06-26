import * as styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
  ariaLabel?: string;
}

export function LoadingSpinner({
  size = 'medium',
  color = 'primary',
  className = '',
  ariaLabel = 'Loading',
}: LoadingSpinnerProps) {
  const spinnerClasses = [
    styles.spinner,
    styles[size],
    styles[color],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={spinnerClasses}
      role="status"
      aria-label={ariaLabel}
    >
      <span className={styles.visuallyHidden}>{ariaLabel}</span>
    </div>
  );
}