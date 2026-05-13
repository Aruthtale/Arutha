import { supabase } from './supabase';

export type DecayStatus = 'ok' | 'warning' | 'fatigue' | 'decay';

export interface DecayResult {
  status: DecayStatus;
  fatigueDays: number;
  message: string;
}

export const checkAndApplyDecay = async (userId: string): Promise<DecayResult> => {
  try {
    const { data: users, error } = await supabase
      .from('arutha_user')
      .select('last_active_date, fatigue_days')
      .eq('id', userId)
      .limit(1);

    if (error) throw error;
    
    const user = users?.[0];
    if (!user) {
      // Jika user belum ada (misal login pertama kali), anggap OK
      return { status: 'ok', fatigueDays: 0, message: '' };
    }

    const lastActive = new Date(user.last_active_date);
    const now = new Date();
    
    // Hitung selisih hari
    const diffTime = Math.abs(now.getTime() - lastActive.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { 
        status: user.fatigue_days >= 3 ? 'decay' : (user.fatigue_days >= 2 ? 'fatigue' : (user.fatigue_days >= 1 ? 'warning' : 'ok')), 
        fatigueDays: user.fatigue_days, 
        message: '' 
      };
    }

    // Update fatigue days
    const newFatigueDays = (user.fatigue_days || 0) + diffDays;
    let status: DecayStatus = 'ok';
    let message = '';
    let shouldDecay = false;

    if (newFatigueDays >= 3) {
      status = 'decay';
      message = 'Karaktermu mengalami Decay. Statistik menurun, segera lakukan Recovery Quest!';
      shouldDecay = true;
    } else if (newFatigueDays === 2) {
      status = 'fatigue';
      message = 'Karaktermu mengalami Fatigue. Jangan biarkan hari ketiga terlewat!';
    } else if (newFatigueDays === 1) {
      status = 'warning';
      message = 'Hati-hati, kamu melewatkan satu hari. Kembalilah beraksi!';
    }

    // Update user di DB
    const updateData: any = {
      last_active_date: now.toISOString(),
      fatigue_days: newFatigueDays,
      updated_at: now.toISOString()
    };
    
    await supabase.from('arutha_user').update(updateData).eq('id', userId);

    // Apply Decay jika sudah 3 hari+
    if (shouldDecay) {
      const { data: profile } = await supabase
        .from('character_profile')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (profile?.[0]) {
        const p = profile[0];
        const decayAmount = 5;
        await supabase.from('character_profile').update({
          jiwa: Math.max(0, p.jiwa - decayAmount),
          raga: Math.max(0, p.raga - decayAmount),
          harta: Math.max(0, p.harta - decayAmount),
          ilmu: Math.max(0, p.ilmu - decayAmount),
          karma: Math.max(0, p.karma - decayAmount),
        }).eq('id', p.id);
      }
    }

    return { status, fatigueDays: newFatigueDays, message };
  } catch (err) {
    console.error("Decay system error:", err);
    return { status: 'ok', fatigueDays: 0, message: '' };
  }
};

export const resetFatigue = async (userId: string) => {
  await supabase.from('arutha_user').update({
    fatigue_days: 0,
    last_active_date: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', userId);
};
