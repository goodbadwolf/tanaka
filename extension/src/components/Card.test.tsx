import { render, fireEvent } from '@testing-library/preact';
import { Card } from './Card';

describe('Card', () => {
  it('renders with children', () => {
    const { getByText } = render(<Card>Card content</Card>);
    expect(getByText('Card content')).toBeInTheDocument();
  });

  it('renders with header and footer', () => {
    const { getByText } = render(
      <Card 
        header="Card Header"
        footer="Card Footer"
      >
        Card Body
      </Card>
    );
    
    expect(getByText('Card Header')).toBeInTheDocument();
    expect(getByText('Card Body')).toBeInTheDocument();
    expect(getByText('Card Footer')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { container, rerender } = render(
      <Card variant="default">Default</Card>
    );
    expect(container.querySelector('.default')).toBeInTheDocument();

    rerender(<Card variant="outlined">Outlined</Card>);
    expect(container.querySelector('.outlined')).toBeInTheDocument();

    rerender(<Card variant="elevated">Elevated</Card>);
    expect(container.querySelector('.elevated')).toBeInTheDocument();
  });

  it('renders with different padding sizes', () => {
    const { container, rerender } = render(
      <Card padding="small">Small padding</Card>
    );
    expect(container.querySelector('.padding-small')).toBeInTheDocument();

    rerender(<Card padding="medium">Medium padding</Card>);
    expect(container.querySelector('.padding-medium')).toBeInTheDocument();

    rerender(<Card padding="large">Large padding</Card>);
    expect(container.querySelector('.padding-large')).toBeInTheDocument();

    rerender(<Card padding="none">No padding</Card>);
    expect(container.querySelector('[class*="padding-"]')).not.toBeInTheDocument();
  });

  it('renders as button when onClick is provided', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Card onClick={handleClick}>Clickable card</Card>
    );
    
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('card', 'interactive');
    
    fireEvent.click(button!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as div when onClick is not provided', () => {
    const { container } = render(<Card>Static card</Card>);
    
    const div = container.querySelector('div.card');
    const button = container.querySelector('button');
    
    expect(div).toBeInTheDocument();
    expect(button).not.toBeInTheDocument();
  });

  it('applies interactive class when interactive prop is true', () => {
    const { container } = render(
      <Card interactive>Interactive card</Card>
    );
    
    expect(container.querySelector('.interactive')).toBeInTheDocument();
  });

  it('applies custom class names', () => {
    const { container } = render(
      <Card 
        className="custom-card"
        headerClassName="custom-header"
        bodyClassName="custom-body"
        footerClassName="custom-footer"
        header="Header"
        footer="Footer"
      >
        Body
      </Card>
    );
    
    expect(container.querySelector('.custom-card')).toBeInTheDocument();
    expect(container.querySelector('.custom-header')).toBeInTheDocument();
    expect(container.querySelector('.custom-body')).toBeInTheDocument();
    expect(container.querySelector('.custom-footer')).toBeInTheDocument();
  });

  it('renders complex content in slots', () => {
    const { getByText, getByRole } = render(
      <Card 
        header={<h2>Complex Header</h2>}
        footer={<button>Footer Button</button>}
      >
        <p>Complex body content</p>
      </Card>
    );
    
    expect(getByText('Complex Header').tagName).toBe('H2');
    expect(getByText('Complex body content').tagName).toBe('P');
    expect(getByRole('button', { name: 'Footer Button' })).toBeInTheDocument();
  });

  it('combines multiple props correctly', () => {
    const handleClick = jest.fn();
    const { container } = render(
      <Card 
        variant="elevated"
        padding="large"
        className="my-card"
        onClick={handleClick}
        header="Test Header"
      >
        Test Content
      </Card>
    );
    
    const card = container.querySelector('button.card');
    expect(card).toHaveClass('elevated', 'padding-large', 'interactive', 'my-card');
  });
});