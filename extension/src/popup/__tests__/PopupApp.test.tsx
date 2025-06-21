import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PopupApp } from '../components/PopupApp';

// Mock WindowTracker component
jest.mock('../components/WindowTracker', () => ({
  WindowTracker: () => null,
}));

describe('PopupApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render', () => {
    const component = PopupApp();
    expect(component).toBeTruthy();
  });
});
