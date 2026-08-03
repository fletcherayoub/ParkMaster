export interface Skin {
  id: string;
  name: string;
  cost: number; // 0 = free/default
  color: string;
  trailColor: string;
  glowColor: string;
  symbol: string;
  description: string;
  /** Optional PNG image asset — if set, the car is rendered as a sprite instead of a colored circle */
  image?: any;
}

export const SKINS: Skin[] = [
  // ─── Default starter — Bike ───────────────────────────────────────────────
  {
    id: 'bike',
    name: 'Street Bike',
    cost: 0,
    color: '#C0C0C0',
    trailColor: '#C0C0C088',
    glowColor: '#C0C0C044',
    symbol: '🏍️',
    description: 'Your trusty starter bike. Fast, light, and free.',
    image: require('../../assets/cars/bike1.png'),
  },
  // ─── Car skins (car1–car9) ────────────────────────────────────────────────
  {
    id: 'car1',
    name: 'Blue Racer',
    cost: 150,
    color: '#2979FF',
    trailColor: '#2979FF88',
    glowColor: '#2979FF44',
    symbol: '🚙',
    description: 'A sleek blue sports car with white racing stripes.',
    image: require('../../assets/cars/car1.png'),
  },
  {
    id: 'car2',
    name: 'Gold Muscle',
    cost: 300,
    color: '#FFD54F',
    trailColor: '#FFD54F88',
    glowColor: '#FFD54F44',
    symbol: '🚗',
    description: 'Yellow muscle car built for straight-line speed.',
    image: require('../../assets/cars/car2.png'),
  },
  {
    id: 'car3',
    name: 'Crimson GT',
    cost: 450,
    color: '#E53935',
    trailColor: '#E5393588',
    glowColor: '#E5393544',
    symbol: '🏎️',
    description: 'High-revving crimson GT with carbon aero.',
    image: require('../../assets/cars/car3.png'),
  },
  {
    id: 'car4',
    name: 'Emerald Sprint',
    cost: 600,
    color: '#00C853',
    trailColor: '#00C85388',
    glowColor: '#00C85344',
    symbol: '🚗',
    description: 'Green dart — corner speed is its game.',
    image: require('../../assets/cars/car4.png'),
  },
  {
    id: 'car5',
    name: 'Shadow Coupe',
    cost: 800,
    color: '#546E7A',
    trailColor: '#546E7A88',
    glowColor: '#546E7A44',
    symbol: '🚙',
    description: 'Matte dark coupe with stealth exhaust.',
    image: require('../../assets/cars/car5.png'),
  },
  {
    id: 'car6',
    name: 'Sunset Charger',
    cost: 1000,
    color: '#FF7A59',
    trailColor: '#FF7A5988',
    glowColor: '#FF7A5944',
    symbol: '🔥',
    description: 'High-torque muscle car built for burning rubber.',
    image: require('../../assets/cars/car6.png'),
  },
  {
    id: 'car7',
    name: 'Mint Phantom',
    cost: 1300,
    color: '#5CFFB1',
    trailColor: '#5CFFB188',
    glowColor: '#5CFFB144',
    symbol: '⚡',
    description: 'Electric mint stealth car with ultra-responsive handling.',
    image: require('../../assets/cars/car7.png'),
  },
  {
    id: 'car8',
    name: 'Violet Hyper',
    cost: 1700,
    color: '#B388FF',
    trailColor: '#B388FF88',
    glowColor: '#B388FF44',
    symbol: '🏎️',
    description: 'Futuristic purple hypercar with plasma exhaust.',
    image: require('../../assets/cars/car8.png'),
  },
  {
    id: 'car9',
    name: 'Plasma V12',
    cost: 2500,
    color: '#FF2A75',
    trailColor: '#FF2A7588',
    glowColor: '#FF2A7544',
    symbol: '🚀',
    description: 'Ultimate rocket-boosted pink supercar. The pinnacle.',
    image: require('../../assets/cars/car9.png'),
  },
];
