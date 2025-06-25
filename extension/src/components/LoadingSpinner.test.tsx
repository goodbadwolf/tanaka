import { render } from '@testing-library/preact';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { getByRole } = render(<LoadingSpinner />);
    const spinner = getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner', 'medium', 'primary');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders with different sizes', () => {
    const { container, rerender } = render(<LoadingSpinner size="small" />);
    expect(container.querySelector('.small')).toBeInTheDocument();

    rerender(<LoadingSpinner size="medium" />);
    expect(container.querySelector('.medium')).toBeInTheDocument();

    rerender(<LoadingSpinner size="large" />);
    expect(container.querySelector('.large')).toBeInTheDocument();
  });

  it('renders with different colors', () => {
    const { container, rerender } = render(<LoadingSpinner color="primary" />);
    expect(container.querySelector('.primary')).toBeInTheDocument();

    rerender(<LoadingSpinner color="secondary" />);
    expect(container.querySelector('.secondary')).toBeInTheDocument();

    rerender(<LoadingSpinner color="white" />);
    expect(container.querySelector('.white')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-spinner" />);
    expect(container.querySelector('.custom-spinner')).toBeInTheDocument();
  });

  it('uses custom aria-label', () => {
    const { getByRole } = render(<LoadingSpinner ariaLabel="Processing request" />);
    const spinner = getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Processing request');
  });

  it('includes visually hidden text for screen readers', () => {
    const { getByText } = render(<LoadingSpinner ariaLabel="Saving data" />);
    const hiddenText = getByText('Saving data');
    expect(hiddenText).toHaveClass('visuallyHidden');
  });

  it('combines multiple props correctly', () => {
    const { container } = render(
      <LoadingSpinner 
        size="large" 
        color="secondary" 
        className="my-spinner"
        ariaLabel="Custom loading"
      />
    );
    
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('spinner', 'large', 'secondary', 'my-spinner');
    expect(spinner).toHaveAttribute('aria-label', 'Custom loading');
  });
});