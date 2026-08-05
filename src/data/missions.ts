export interface Mission {
  id: string;
  name: string;
  description: string;
  targetKey: 'distance' | 'coins' | 'score';
  targetValue: number;
  reward: number;
}

export const MISSIONS: Mission[] = [
  {
    id: 'dist_800',
    name: 'Distance Runner',
    description: 'Reach 800m total distance',
    targetKey: 'distance',
    targetValue: 800,
    reward: 150,
  },
  {
    id: 'coins_30',
    name: 'Gold Grabber',
    description: 'Collect 30 coins/gems',
    targetKey: 'coins',
    targetValue: 30,
    reward: 100,
  },
  {
    id: 'score_1000',
    name: 'Highway Master',
    description: 'Earn a total score of 1,000',
    targetKey: 'score',
    targetValue: 1000,
    reward: 250,
  },
];
