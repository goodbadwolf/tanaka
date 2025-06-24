import { jest } from '@jest/globals';
import { createMockTanakaAPI } from '../../test-utils/mock-factories';

export const TanakaAPI = jest.fn().mockImplementation(() => createMockTanakaAPI());
