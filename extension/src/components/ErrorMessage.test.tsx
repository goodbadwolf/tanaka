import { render, fireEvent } from '@testing-library/preact';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('renders with required message prop', () => {
    const { getByRole } = render(<ErrorMessage message="Something went wrong" />);
    const alert = getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Something went wrong');
  });

  it('renders with title and message', () => {
    const { getByText } = render(
      <ErrorMessage title="Error" message="Failed to save changes" />
    );
    expect(getByText('Error')).toBeInTheDocument();
    expect(getByText('Failed to save changes')).toBeInTheDocument();
  });

  it('renders different type variants', () => {
    const { container, rerender } = render(
      <ErrorMessage type="error" message="Error message" />
    );
    expect(container.querySelector('.error')).toBeInTheDocument();

    rerender(<ErrorMessage type="warning" message="Warning message" />);
    expect(container.querySelector('.warning')).toBeInTheDocument();

    rerender(<ErrorMessage type="info" message="Info message" />);
    expect(container.querySelector('.info')).toBeInTheDocument();
  });

  it('shows dismiss button when dismissible and onDismiss provided', () => {
    const handleDismiss = jest.fn();
    const { getByLabelText } = render(
      <ErrorMessage
        message="Dismissible error"
        dismissible={true}
        onDismiss={handleDismiss}
      />
    );

    const dismissButton = getByLabelText('Dismiss message');
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('hides dismiss button when not dismissible', () => {
    const handleDismiss = jest.fn();
    const { queryByLabelText } = render(
      <ErrorMessage
        message="Non-dismissible error"
        dismissible={false}
        onDismiss={handleDismiss}
      />
    );

    expect(queryByLabelText('Dismiss message')).not.toBeInTheDocument();
  });

  it('hides dismiss button when onDismiss not provided', () => {
    const { queryByLabelText } = render(
      <ErrorMessage
        message="Error without handler"
        dismissible={true}
      />
    );

    expect(queryByLabelText('Dismiss message')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ErrorMessage message="Custom class" className="custom-error" />
    );
    expect(container.querySelector('.custom-error')).toBeInTheDocument();
  });

  it('uses correct ARIA role', () => {
    const { getByRole, rerender } = render(
      <ErrorMessage message="Alert message" role="alert" />
    );
    expect(getByRole('alert')).toBeInTheDocument();

    rerender(<ErrorMessage message="Status message" role="status" />);
    expect(getByRole('status')).toBeInTheDocument();
  });

  it('renders dismiss button with correct accessibility', () => {
    const { container } = render(
      <ErrorMessage
        message="Test"
        onDismiss={() => {}}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('handles long messages gracefully', () => {
    const longMessage = 'This is a very long error message that should wrap properly and not break the layout of the error component when displayed';

    const { getByText } = render(<ErrorMessage message={longMessage} />);
    expect(getByText(longMessage)).toBeInTheDocument();
  });
});
