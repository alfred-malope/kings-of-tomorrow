export interface Club {
  name: string;
  shortName: string;
  abbreviation: string;
  founded: number;
  motto: string;
  logo: string;
  monogram: string;
  location: string;
  email: string;
  phone: string;
  venue: string;
  colors: {
    navy: string;
    blue: string;
    gold: string;
    silver: string;
    white: string;
  };
}

export const club: Club = {
  name: 'Kings Of Tomorrow FC',
  shortName: 'K.O.T FC',
  abbreviation: 'K.O.T',
  founded: 2025,
  motto: 'One Team. One Vision. One Future.',
  logo: '/kot-logo.svg',
  monogram: '/kot-monogram.svg',
  location: 'South Africa',
  email: 'info@kotfc.co.za',
  phone: '+27 11 234 5678',
  venue: 'K.O.T Stadium',
  colors: {
    navy: '#071426',
    blue: '#00AEEF',
    gold: '#F4B942',
    silver: '#C9D0D8',
    white: '#FFFFFF',
  },
};

export interface ClubStats {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
}

export const clubStats: ClubStats = {
  matches: 12,
  wins: 8,
  draws: 2,
  losses: 2,
  goals: 27,
};

export interface ClubValue {
  title: string;
  description: string;
  icon: string;
}

export const clubValues: ClubValue[] = [
  {
    title: 'Teamwork',
    description: 'We rise together. Every player, every pass, every goal is built on collective effort and brotherhood.',
    icon: 'users',
  },
  {
    title: 'Discipline',
    description: 'On the pitch and off it, we hold ourselves to the highest standards of commitment and focus.',
    icon: 'shield',
  },
  {
    title: 'Ambition',
    description: 'We play to win. Every match is a step toward our vision of becoming champions.',
    icon: 'target',
  },
  {
    title: 'Respect',
    description: 'For the badge, for our opponents, for the game. Respect is the foundation of everything we do.',
    icon: 'heart',
  },
  {
    title: 'Community',
    description: 'We represent our people. K.O.T FC belongs to the community that supports us.',
    icon: 'globe',
  },
  {
    title: 'Excellence',
    description: 'We never settle. We strive for excellence in training, in performance, and in character.',
    icon: 'star',
  },
];
