import { JSX } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import styles from './Input.module.css';

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'url' | 'number';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | boolean;
  helperText?: string;
  label?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  onChange?: (value: string) => void;
  onBlur?: (e: JSX.TargetedFocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: JSX.TargetedFocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: JSX.TargetedKeyboardEvent<HTMLInputElement>) => void;
  validate?: (value: string) => string | undefined;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  min?: string | number;
  max?: string | number;
}

export function Input({
  type = 'text',
  value: controlledValue,
  defaultValue = '',
  placeholder,
  disabled = false,
  required = false,
  error,
  helperText,
  label,
  id,
  name,
  autoComplete,
  autoFocus = false,
  fullWidth = false,
  size = 'medium',
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  validate,
  className = '',
  inputClassName = '',
  ariaLabel,
  ariaDescribedBy,
  min,
  max,
}: InputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const hasError = Boolean(error || (touched && validationError));
  const errorMessage = typeof error === 'string' ? error : validationError;

  useEffect(() => {
    if (validate && value && touched) {
      setValidationError(validate(value));
    }
  }, [validate, value, touched]);

  const handleChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
    const newValue = (e.target as HTMLInputElement).value;

    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    if (validate && touched) {
      setValidationError(validate(newValue));
    }

    onChange?.(newValue);
  };

  const handleBlur = (e: JSX.TargetedFocusEvent<HTMLInputElement>) => {
    setTouched(true);

    if (validate && value) {
      setValidationError(validate(value));
    }

    onBlur?.(e);
  };

  const containerClasses = [styles.container, fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [styles.input, styles[size], hasError && styles.error, inputClassName]
    .filter(Boolean)
    .join(' ');

  const inputId =
    id || (label ? `input-${name || Math.random().toString(36).substr(2, 9)}` : undefined);
  const errorId = hasError && errorMessage ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={inputClasses}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel || label}
        aria-invalid={hasError}
        aria-describedby={
          [errorId, helperId, ariaDescribedBy].filter(Boolean).join(' ') || undefined
        }
        min={min}
        max={max}
      />

      {hasError && errorMessage && (
        <span id={errorId} className={styles.errorText} role="alert">
          {errorMessage}
        </span>
      )}

      {helperText && !hasError && (
        <span id={helperId} className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  );
}
