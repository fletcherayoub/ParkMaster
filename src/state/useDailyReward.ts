import { useEffect, useState } from 'react';
import { usePlayerStore } from './usePlayerStore';

export function useDailyReward() {
  const hydrated = usePlayerStore((s) => s.hydrated);
  const claimDailyReward = usePlayerStore((s) => s.claimDailyReward);
  const [popup, setPopup] = useState<{ streakDays: number; coinsAwarded: number } | null>(null);

  useEffect(() => {
    // Wait until hydrate() has loaded real MMKV data before checking the
    // streak. Without this guard, the effect fires against the zero defaults
    // (streak=0, lastPlayedDate=null) and awards coins on every cold boot.
    if (!hydrated) return;
    const result = claimDailyReward();
    if (result) setPopup(result);
  }, [hydrated, claimDailyReward]);

  return { popup, dismiss: () => setPopup(null) };
}
