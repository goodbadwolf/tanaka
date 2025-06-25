import { JSX } from 'preact';
import styles from './ErrorMessage.module.css';

export interface ErrorMessageProps {
  type?: 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
  role?: 'alert' | 'status';
}

export function ErrorMessage({
  type = 'error',
  title,
  message,
  onDismiss,
  dismissible = true,
  className = '',
  role = 'alert',
}: ErrorMessageProps) {
  const containerClasses = [
    styles.container,
    styles[type],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const showDismissButton = dismissible && onDismiss;

  return (
    <div className={containerClasses} role={role}>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{message}</div>
      </div>
      
      {showDismissButton && (
        <button
          type="button"
          className={styles.dismissButton}
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}