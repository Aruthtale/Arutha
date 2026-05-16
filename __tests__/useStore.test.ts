import { describe, it, expect, vi, beforeEach } from 'vitest';

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('sessionStorage', sessionStorageMock);

// Import AFTER stubbing globals
import { useStore } from '../src/store/useStore';

describe('useStore reducers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update stats correctly', () => {
    const { setStats } = useStore.getState();
    setStats({ JIWA: 60, RAGA: 60, HARTA: 60, ILMU: 60, KARMA: 60 });
    expect(useStore.getState().stats.JIWA).toBe(60);
  });

  it('should update session and user ID', () => {
    const { setDbUserId } = useStore.getState();
    setDbUserId('test-id-123');
    expect(useStore.getState().dbUserId).toBe('test-id-123');
  });

  it('should handle functional updates for xp', () => {
    const { setXp } = useStore.getState();
    useStore.setState({ xp: 100 });
    setXp((prev) => prev + 50);
    expect(useStore.getState().xp).toBe(150);
  });
});
