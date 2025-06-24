import { container } from 'tsyringe';

export function createTestContainer() {
  return container.createChildContainer();
}
