import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { getLocalTimestamp, getTodayDate, extractDate, isToday, isNewDay, getISOWeek, isNewWeek } from '../src/lib/dateUtils';

describe('dateUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getLocalTimestamp formats correctly', () => {
    const date = new Date(2026, 4, 10, 0, 28, 0); // May is month 4
    vi.setSystemTime(date);
    expect(getLocalTimestamp()).toBe('2026-05-10 00:28:00');
  });

  it('getTodayDate formats correctly', () => {
    const date = new Date(2026, 4, 10, 0, 28, 0);
    vi.setSystemTime(date);
    expect(getTodayDate()).toBe('2026-05-10');
  });

  it('extractDate extracts YYYY-MM-DD from various formats', () => {
    expect(extractDate('2026-05-10 00:28:00')).toBe('2026-05-10');
    expect(extractDate('2026-05-10T00:28:00Z')).toBe('2026-05-10');
    expect(extractDate(null)).toBeNull();
  });

  it('isToday checks if timestamp is today locally', () => {
    const date = new Date(2026, 4, 10, 15, 0, 0);
    vi.setSystemTime(date);
    
    expect(isToday('2026-05-10 00:28:00')).toBe(true);
    expect(isToday('2026-05-09 23:59:59')).toBe(false);
  });

  it('isNewWeek detects week changes', () => {
    // Setting to a Sunday
    const sunday = new Date(2026, 4, 10, 15, 0, 0);
    vi.setSystemTime(sunday);
    
    // Still same week as the Friday before
    expect(isNewWeek('2026-05-08 12:00:00')).toBe(false);
    
    // Different week than the next Monday
    const monday = new Date(2026, 4, 11, 15, 0, 0);
    vi.setSystemTime(monday);
    expect(isNewWeek('2026-05-10 12:00:00')).toBe(true);
  });
});
