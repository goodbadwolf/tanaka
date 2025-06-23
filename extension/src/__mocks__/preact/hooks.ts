import { jest } from '@jest/globals';

export const useState = jest.fn((initial: unknown) => [initial, jest.fn()]);
export const useEffect = jest.fn();
export const useCallback = jest.fn((cb: unknown) => cb);
export const useRef = jest.fn((initial: unknown) => ({ current: initial }));
export const useMemo = jest.fn((fn: () => unknown) => fn());
export const useLayoutEffect = jest.fn();
export const useReducer = jest.fn();
export const useContext = jest.fn();
export const useImperativeHandle = jest.fn();
export const useDebugValue = jest.fn();
