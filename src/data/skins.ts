export interface Skin {
  id: string;
  name: string;
  cost: number; // 0 = free/default
  color: string;
  trailColor: string;
}

export const SKINS: Skin[] = [
  { id: 'classic', name: 'Classic', cost: 0, color: '#4FD1FF', trailColor: '#1E90FF66' },
  { id: 'sunset', name: 'Sunset', cost: 300, color: '#FF7A59', trailColor: '#FF3D0066' },
  { id: 'mint', name: 'Mint', cost: 300, color: '#5CFFB1', trailColor: '#00E68A66' },
  { id: 'violet', name: 'Violet', cost: 500, color: '#B388FF', trailColor: '#7C4DFF66' },
  { id: 'gold', name: 'Gold Rush', cost: 1200, color: '#FFD54F', trailColor: '#FFB30066' },
];
