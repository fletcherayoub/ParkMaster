import { useEffect, useState } from 'react';
import { usePlayerStore } from './usePlayerStore';

export function useDailyReward() {
  const claimDailyReward = usePlayerStore((s) => s.claimDailyReward);
  const [popup, setPopup] = useState<{ streakDays: number; coinsAwarded: number } | null>(null);

  useEffect(() => {
    const result = claimDailyReward();
    if (result) setPopup(result);
  }, [claimDailyReward]);

  return { popup, dismiss: () => setPopup(null) };
}
