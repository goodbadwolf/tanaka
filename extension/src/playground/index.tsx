import { render } from 'preact';
import { PlaygroundApp } from './PlaygroundApp';

const root = document.getElementById('root');
if (root) {
  render(<PlaygroundApp />, root);
} else {
  // Show a message to the user
  const message = document.createElement('div');
  message.textContent = 'No root element found. Please check your browser console for errors.';
  message.style.color = 'red';
  message.style.fontFamily = 'sans-serif';
  message.style.fontSize = '16px';
  message.style.textAlign = 'center';
  message.style.padding = '20px';
  message.style.border = '1px solid red';
  message.style.borderRadius = '5px';
  document.body.appendChild(message);
}
