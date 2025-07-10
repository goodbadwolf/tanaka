import React, { useId } from 'react';
import './toggle.scss';

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  defaultChecked,
  onChange,
  label,
  size = 'medium',
  disabled = false,
  className = '',
  id,
  name,
  'aria-label': ariaLabel,
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange && !disabled) {
      onChange(event.currentTarget.checked);
    }
  };

  const sizeClass = size !== 'medium' ? `toggle--${size}` : '';
  const disabledClass = disabled ? 'toggle--disabled' : '';
  const classNames = ['toggle', sizeClass, disabledClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={classNames} htmlFor={inputId}>
      <input
        type="checkbox"
        id={inputId}
        name={name}
        className="toggle__input"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel || label}
      />
      <span className="toggle__switch" />
      {label && <span className="toggle__label">{label}</span>}
    </label>
  );
};
