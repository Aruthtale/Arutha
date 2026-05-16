import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAndApplyDecay, resetFatigue } from '../src/lib/decaySystem';
import { supabase } from '../src/lib/supabase';

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('decaySystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('returns ok for new user', async () => {
    // Mock user not found
    (supabase.from as any).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));

    const result = await checkAndApplyDecay('test-user');
    expect(result.status).toBe('ok');
    expect(result.fatigueDays).toBe(0);
  });

  it('calculates fatigue correctly based on last_active_date', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    (supabase.from as any).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ 
        data: [{ last_active_date: twoDaysAgo.toISOString(), fatigue_days: 0 }], 
        error: null 
      }),
    }));

    const result = await checkAndApplyDecay('test-user');
    expect(result.fatigueDays).toBe(2);
    expect(result.status).toBe('fatigue');
  });

  it('triggers decay when fatigue days >= 3', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    (supabase.from as any).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ 
        data: [{ last_active_date: threeDaysAgo.toISOString(), fatigue_days: 0 }], 
        error: null 
      }),
    }));

    const result = await checkAndApplyDecay('test-user');
    expect(result.status).toBe('decay');
    expect(result.message).toContain('Karaktermu mengalami Decay');
  });
});
