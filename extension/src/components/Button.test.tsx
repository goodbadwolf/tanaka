import { h } from 'preact';
import { render, fireEvent } from '@testing-library/preact';
import { Button } from './Button';

describe('Button', () => {
  it('renders with default props', () => {
    const { getByText } = render(<Button>Click me</Button>);
    const button = getByText('Click me');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('button', 'primary', 'medium');
  });

  it('renders with different variants', () => {
    const { rerender, container } = render(<Button variant="primary">Primary</Button>);
    expect(container.querySelector('.primary')).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(container.querySelector('.secondary')).toBeInTheDocument();

    rerender(<Button variant="danger">Danger</Button>);
    expect(container.querySelector('.danger')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender, container } = render(<Button size="small">Small</Button>);
    expect(container.querySelector('.small')).toBeInTheDocument();

    rerender(<Button size="medium">Medium</Button>);
    expect(container.querySelector('.medium')).toBeInTheDocument();

    rerender(<Button size="large">Large</Button>);
    expect(container.querySelector('.large')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    const { getByText } = render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    
    const button = getByText('Disabled') as HTMLButtonElement;
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner when loading prop is true', () => {
    const { container, queryByText } = render(<Button loading>Loading</Button>);
    
    expect(queryByText('Loading')).not.toBeInTheDocument();
    expect(container.querySelector('.loadingSpinner')).toBeInTheDocument();
    expect(container.querySelector('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('disables button when loading', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Button loading onClick={handleClick}>
        Loading
      </Button>
    );
    
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders full width when fullWidth prop is true', () => {
    const { container } = render(<Button fullWidth>Full Width</Button>);
    expect(container.querySelector('.fullWidth')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('sets correct button type', () => {
    const { container, rerender } = render(<Button type="submit">Submit</Button>);
    expect(container.querySelector('button')).toHaveAttribute('type', 'submit');

    rerender(<Button type="reset">Reset</Button>);
    expect(container.querySelector('button')).toHaveAttribute('type', 'reset');
  });

  it('sets aria-label when provided', () => {
    const { container } = render(<Button ariaLabel="Close dialog">X</Button>);
    expect(container.querySelector('button')).toHaveAttribute('aria-label', 'Close dialog');
  });
});