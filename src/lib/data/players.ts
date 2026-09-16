import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../firebase';

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


export const positionGroups: { label: string; value: Position | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Goalkeepers', value: 'Goalkeeper' },
  { label: 'Defenders', value: 'Defender' },
  { label: 'Midfielders', value: 'Midfielder' },
  { label: 'Forwards', value: 'Forward' },
];

type AdminPlayer = {
  id: string;
  displayName: string;
  squadNumber: number;
  position: Position;
  bio: string;
  photoUrl: string | null;
  photoBase64: string | null;
};

/** Loads active squad players managed in the admin portal. */
export async function loadPublicPlayers(): Promise<Player[]> {
  const snapshot = await getDocs(query(collection(firestore, 'players'), where('status', '==', 'active')));
  return snapshot.docs
    .map((playerDoc) => {
      const player = { id: playerDoc.id, ...playerDoc.data() } as AdminPlayer;
      return {
        id: player.id,
        name: player.displayName,
        number: player.squadNumber,
        position: player.position,
        image: player.photoBase64 || player.photoUrl || '/kot-logo.png',
        bio: player.bio,
      };
    })
    .sort((left, right) => left.number - right.number);
}
