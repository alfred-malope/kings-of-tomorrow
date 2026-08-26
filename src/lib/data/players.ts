export type Position = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: Position;
  image: string;
  bio?: string;
  nationality?: string;
  age?: number;
}

const playerImages = {
  gk: 'https://images.pexels.com/photos/36992293/pexels-photo-36992293.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
  def: 'https://images.pexels.com/photos/38740308/pexels-photo-38740308.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
  mid: 'https://images.pexels.com/photos/38728271/pexels-photo-38728271.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
  fwd: 'https://images.pexels.com/photos/35227289/pexels-photo-35227289.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
  fwd2: 'https://images.pexels.com/photos/38895623/pexels-photo-38895623.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
  mid2: 'https://images.pexels.com/photos/38895619/pexels-photo-38895619.jpeg?auto=compress&cs=tinysrgb&w=600&h=750&fit=crop',
};

export const players: Player[] = [
  {
    id: 'thabo-mokoena',
    name: 'Thabo Mokoena',
    number: 1,
    position: 'Goalkeeper',
    image: playerImages.gk,
    nationality: 'South Africa',
    age: 24,
    bio: 'A commanding presence between the posts with lightning reflexes and exceptional distribution.',
  },
  {
    id: 'lebo-ngobeni',
    name: 'Lebo Ngobeni',
    number: 16,
    position: 'Goalkeeper',
    image: playerImages.gk,
    nationality: 'South Africa',
    age: 21,
    bio: 'Young shot-stopper with a bright future and a calm temperament under pressure.',
  },
  {
    id: 'sipho-dlamini',
    name: 'Sipho Dlamini',
    number: 2,
    position: 'Defender',
    image: playerImages.def,
    nationality: 'South Africa',
    age: 26,
    bio: 'Tough-tackling right-back who combines defensive solidity with attacking forays down the flank.',
  },
  {
    id: 'kabelo-mahlangu',
    name: 'Kabelo Mahlangu',
    number: 4,
    position: 'Defender',
    image: playerImages.def,
    nationality: 'South Africa',
    age: 27,
    bio: 'Vice-captain and defensive leader. Reads the game brilliantly and organises the backline.',
  },
  {
    id: 'thabo-rampa',
    name: 'Thabo Rampa',
    number: 5,
    position: 'Defender',
    image: playerImages.def,
    nationality: 'South Africa',
    age: 25,
    bio: 'Dominant in the air and composed on the ball. A cornerstone of the K.O.T defence.',
  },
  {
    id: 'jacob-molefe',
    name: 'Jacob Molefe',
    number: 3,
    position: 'Defender',
    image: playerImages.def,
    nationality: 'South Africa',
    age: 23,
    bio: 'Explosive left-back with pace to burn and a dangerous crossing ability.',
  },
  {
    id: 'alfred-malope',
    name: 'Alfred Malope',
    number: 10,
    position: 'Midfielder',
    image: playerImages.mid,
    nationality: 'South Africa',
    age: 25,
    bio: 'Club captain and creative engine. Vision, technique, and leadership personified.',
  },
  {
    id: 'pieter-van-wyk',
    name: 'Pieter van Wyk',
    number: 8,
    position: 'Midfielder',
    image: playerImages.mid2,
    nationality: 'South Africa',
    age: 24,
    bio: 'Box-to-box midfielder with an engine that never stops and an eye for a key pass.',
  },
  {
    id: 'mandla-zulu',
    name: 'Mandla Zulu',
    number: 6,
    position: 'Midfielder',
    image: playerImages.mid,
    nationality: 'South Africa',
    age: 22,
    bio: 'Defensive midfielder who breaks up play and kickstarts attacks with intelligent distribution.',
  },
  {
    id: 'bongani-khumalo',
    name: 'Bongani Khumalo',
    number: 14,
    position: 'Midfielder',
    image: playerImages.mid2,
    nationality: 'South Africa',
    age: 21,
    bio: 'Young playmaker with flair and creativity. A rising star in the K.O.T midfield.',
  },
  {
    id: 'katlego-molepo',
    name: 'Katlego Molepo',
    number: 9,
    position: 'Forward',
    image: playerImages.fwd,
    nationality: 'South Africa',
    age: 26,
    bio: 'Prolific striker with a natural goal-scoring instinct. The focal point of the K.O.T attack.',
  },
  {
    id: 'themba-nyathi',
    name: 'Themba Nyathi',
    number: 7,
    position: 'Forward',
    image: playerImages.fwd2,
    nationality: 'South Africa',
    age: 23,
    bio: 'Electric winger with blistering pace and an eye for goal. A nightmare for defenders.',
  },
  {
    id: 'lunga-ndlovu',
    name: 'Lunga Ndlovu',
    number: 11,
    position: 'Forward',
    image: playerImages.fwd2,
    nationality: 'South Africa',
    age: 22,
    bio: 'Versatile forward with clinical finishing and intelligent movement off the ball.',
  },
  {
    id: 'sizwe-mabena',
    name: 'Sizwe Mabena',
    number: 17,
    position: 'Forward',
    image: playerImages.fwd,
    nationality: 'South Africa',
    age: 20,
    bio: 'Young striker breaking through the ranks. Strong, fast, and hungry for goals.',
  },
];

export const positionGroups: { label: string; value: Position | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Goalkeepers', value: 'Goalkeeper' },
  { label: 'Defenders', value: 'Defender' },
  { label: 'Midfielders', value: 'Midfielder' },
  { label: 'Forwards', value: 'Forward' },
];
