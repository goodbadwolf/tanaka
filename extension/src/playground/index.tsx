import { render } from 'preact';
import { PlaygroundApp } from './playground-app';

const root = document.getElementById('root');
if (root) {
  render(<PlaygroundApp />, root);
} else {
  const errorContainer = document.createElement('div');
  errorContainer.setAttribute('role', 'alert');
  errorContainer.setAttribute('aria-live', 'assertive');

  Object.assign(errorContainer.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '600px',
    padding: '24px',
    backgroundColor: '#fef2f2',
    border: '2px solid #dc2626',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#991b1b',
    zIndex: '9999'
  });

  const title = document.createElement('h3');
  Object.assign(title.style, {
    margin: '0 0 12px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#dc2626'
  });
  title.textContent = 'Failed to Initialize Playground';

  const message = document.createElement('p');
  Object.assign(message.style, {
    margin: '0 0 16px 0',
    fontSize: '16px',
    lineHeight: '1.5'
  });
  message.textContent = 'The playground root element could not be found. This usually indicates a configuration issue.';

  const details = document.createElement('div');
  Object.assign(details.style, {
    padding: '12px',
    backgroundColor: '#fee2e2',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'monospace',
    marginBottom: '16px'
  });
  details.innerHTML = `
    <strong>Expected:</strong> &lt;div id="root"&gt;&lt;/div&gt;<br>
    <strong>Location:</strong> ${window.location.pathname}
  `;

  const actions = document.createElement('div');
  Object.assign(actions.style, {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  });

  const reloadButton = document.createElement('button');
  Object.assign(reloadButton.style, {
    padding: '8px 16px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  });
  reloadButton.textContent = 'Reload Page';
  reloadButton.onclick = () => window.location.reload();
  reloadButton.onmouseenter = () => reloadButton.style.backgroundColor = '#b91c1c';
  reloadButton.onmouseleave = () => reloadButton.style.backgroundColor = '#dc2626';

  errorContainer.appendChild(title);
  errorContainer.appendChild(message);
  errorContainer.appendChild(details);
  actions.appendChild(reloadButton);
  errorContainer.appendChild(actions);

  document.body.appendChild(errorContainer);

  console.error('Playground initialization failed: Root element with id="root" not found');
}
