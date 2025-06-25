import { ComponentChildren } from 'preact';
import styles from './Card.module.css';

export interface CardProps {
  header?: ComponentChildren;
  footer?: ComponentChildren;
  children: ComponentChildren;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function Card({
  header,
  footer,
  children,
  variant = 'default',
  padding = 'medium',
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  onClick,
  interactive = false,
}: CardProps) {
  const cardClasses = [
    styles.card,
    styles[variant],
    padding !== 'none' && styles[`padding-${padding}`],
    (interactive || onClick) && styles.interactive,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const headerClasses = [styles.header, headerClassName].filter(Boolean).join(' ');
  const bodyClasses = [styles.body, bodyClassName].filter(Boolean).join(' ');
  const footerClasses = [styles.footer, footerClassName].filter(Boolean).join(' ');

  const CardElement = onClick ? 'button' : 'div';
  const cardProps: any = {
    className: cardClasses,
  };

  if (onClick) {
    cardProps.onClick = onClick;
    cardProps.type = 'button';
  }

  return (
    <CardElement {...cardProps}>
      {header && <div className={headerClasses}>{header}</div>}
      <div className={bodyClasses}>{children}</div>
      {footer && <div className={footerClasses}>{footer}</div>}
    </CardElement>
  );
}