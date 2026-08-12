export interface Mission {
  id: string;
  name: string;
  description: string;
  targetKey: 'distance' | 'coins' | 'score' | 'near_misses';
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
  {
    id: 'near_miss_10',
    name: 'Close Shave',
    description: 'Perform 10 near misses',
    targetKey: 'near_misses',
    targetValue: 10,
    reward: 200,
  },
  {
    id: 'dist_3000',
    name: 'Marathoner',
    description: 'Reach 3,000m total distance',
    targetKey: 'distance',
    targetValue: 3000,
    reward: 500,
  },
  {
    id: 'coins_200',
    name: 'Treasure Hunter',
    description: 'Collect 200 coins/gems',
    targetKey: 'coins',
    targetValue: 200,
    reward: 350,
  },
];
