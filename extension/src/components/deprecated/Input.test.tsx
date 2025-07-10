import { render, fireEvent, waitFor } from '@testing-library/preact';
import { Input } from './Input';

describe('Input', () => {
  it('renders with default props', () => {
    const { container } = render(<Input />);
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders with label', () => {
    const { getByLabelText } = render(<Input label="Email Address" />);
    expect(getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    const { getByLabelText } = render(<Input label="Email" required />);
    const requiredIndicator = getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
  });

  it('handles controlled value', () => {
    const handleChange = jest.fn();
    const { container, rerender } = render(<Input value="initial" onChange={handleChange} />);

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('initial');

    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledWith('new value');

    rerender(<Input value="updated" onChange={handleChange} />);
    expect(input.value).toBe('updated');
  });

  it('handles uncontrolled value with defaultValue', () => {
    const { container } = render(<Input defaultValue="default" />);
    const input = container.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('default');

    fireEvent.change(input, { target: { value: 'changed' } });
    expect(input.value).toBe('changed');
  });

  it('displays error message', () => {
    const { getByRole } = render(<Input error="Invalid email address" />);
    const error = getByRole('alert');
    expect(error).toBeInTheDocument();
    expect(error).toHaveTextContent('Invalid email address');
  });

  it('displays helper text when no error', () => {
    const { getByText, queryByRole } = render(<Input helperText="Enter a valid email address" />);
    expect(getByText('Enter a valid email address')).toBeInTheDocument();
    expect(queryByRole('alert')).not.toBeInTheDocument();
  });

  it('hides helper text when error is shown', () => {
    const { queryByText, getByRole } = render(<Input error="Invalid" helperText="Helper text" />);
    expect(getByRole('alert')).toHaveTextContent('Invalid');
    expect(queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('validates on blur', async () => {
    const validate = jest.fn((value: string) => (value.length < 3 ? 'Too short' : undefined));

    const { container, getByRole } = render(<Input validate={validate} defaultValue="ab" />);

    const input = container.querySelector('input') as HTMLInputElement;

    fireEvent.blur(input);

    await waitFor(() => {
      expect(validate).toHaveBeenCalledWith('ab');
      expect(getByRole('alert')).toHaveTextContent('Too short');
    });
  });

  it('validates on change after being touched', async () => {
    const validate = jest.fn((value: string) => (value.length < 3 ? 'Too short' : undefined));

    const { container, getByRole, queryByRole } = render(
      <Input validate={validate} defaultValue="" />,
    );

    const input = container.querySelector('input') as HTMLInputElement;

    // First blur to mark as touched
    fireEvent.blur(input);

    // Then type
    fireEvent.change(input, { target: { value: 'a' } });

    await waitFor(() => {
      expect(getByRole('alert')).toHaveTextContent('Too short');
    });

    // Type more to pass validation
    fireEvent.change(input, { target: { value: 'abc' } });

    await waitFor(() => {
      expect(queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('disables input when disabled prop is true', () => {
    const { container } = render(<Input disabled />);
    const input = container.querySelector('input');
    expect(input).toBeDisabled();
  });

  it('renders different input types', () => {
    const { container, rerender } = render(<Input type="email" />);
    expect(container.querySelector('input')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    expect(container.querySelector('input')).toHaveAttribute('type', 'password');

    rerender(<Input type="url" />);
    expect(container.querySelector('input')).toHaveAttribute('type', 'url');
  });

  it('applies size classes', () => {
    const { container, rerender } = render(<Input size="small" />);
    expect(container.querySelector('input')).toBeInTheDocument();

    rerender(<Input size="medium" />);
    expect(container.querySelector('input')).toBeInTheDocument();

    rerender(<Input size="large" />);
    expect(container.querySelector('input')).toBeInTheDocument();
  });

  it('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();

    const { container } = render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

    const input = container.querySelector('input') as HTMLInputElement;

    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalled();

    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalled();
  });

  it('sets proper aria attributes', () => {
    const { container } = render(
      <Input
        label="Email"
        error="Invalid email"
        helperText="Enter your email"
        ariaDescribedBy="external-help"
      />,
    );

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-label', 'Email');

    const describedBy = input?.getAttribute('aria-describedby');
    expect(describedBy).toContain('error');
    expect(describedBy).toContain('external-help');
  });
});
