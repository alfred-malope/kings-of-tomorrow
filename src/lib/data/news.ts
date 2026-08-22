export type NewsCategory =
  | 'Match Report'
  | 'Team News'
  | 'Training'
  | 'Club News'
  | 'Announcement';

export interface NewsArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  date: string;
  image: string;
  content: string[];
  author: string;
  readTime: number;
}

const heroImg = 'https://images.pexels.com/photos/32190714/pexels-photo-32190714.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop';
const trainingImg = 'https://images.pexels.com/photos/38615788/pexels-photo-38615788.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop';
const celebrationImg = 'https://images.pexels.com/photos/32179165/pexels-photo-32179165.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop';
const teamImg = 'https://images.pexels.com/photos/16499011/pexels-photo-16499011.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop';
const stadiumImg = 'https://images.pexels.com/photos/30651230/pexels-photo-30651230.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop';
const actionImg = 'https://images.pexels.com/photos/38615473/pexels-photo-38615473.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop';

export const news: NewsArticle[] = [
  {
    slug: 'kot-fc-to-compete-in-nellyview-diski-challenge-top-16',
    title: 'K.O.T FC Set to Compete in Nellyview Diski Challenge Top 16',
    excerpt:
      'Kings Of Tomorrow FC will compete in the Nellyview Diski Challenge Top 16 tournament this December, with fixtures still to be announced.',
    category: 'Club News',
    date: '2026-08-22',
    image: '/news/nellyview-diski-challenge.jpeg',
    author: 'K.O.T Media Team',
    readTime: 2,
    content: [
      'Kings Of Tomorrow FC are set to take part in the Nellyview Diski Challenge Top 16 tournament, scheduled to take place from 27 to 30 December 2026.',

      'The tournament will bring together 16 teams for a competitive end-of-year football showcase. K.O.T FC are looking forward to representing the club and competing against some of the teams taking part in the challenge.',

      'The tournament will be hosted at Nelly Primary School. With the competition set to take place over four days, supporters can expect an exciting football atmosphere as teams battle for the top positions.',

      'The official fixtures and K.O.T FC match schedule have not yet been released. Once the fixtures are confirmed, the club will publish the dates, opponents and kick-off times through its official channels.',

      'K.O.T FC looks forward to the challenge and to finishing the year on a strong note. Supporters are encouraged to stay tuned for further tournament updates.'
    ],
  },
  {
    slug: 'kot-fc-fall-to-poulos-manchester-united-in-top-8-opener',
    title: 'K.O.T FC Fall to Poulos Manchester United in Top 8 Tournament Opener',
    excerpt:
      'Kings Of Tomorrow FC opened their Poulos Village Market & Soccer Festival Top 8 campaign with a 4-2 defeat to Poulos Manchester United F.C.',
    category: 'Match Report',
    date: '2026-08-08',
    image: '/news/poulos-top-8-tournament.jpeg',
    author: 'K.O.T Media Team',
    readTime: 2,
    content: [
      'Kings Of Tomorrow FC opened their campaign in the Poulos Village Market & Soccer Festival Top 8 Tournament with a 4-2 defeat against Poulos Manchester United F.C.',

      'The tournament, held at Fast 11 Sports Ground in Poulos – Ga-Monene on 8 and 9 August 2026, brought together eight teams competing for the tournament title and a share of the prize pool.',

      'K.O.T FC arrived late for their opening fixture and were handed a one-goal penalty before the match. Despite the difficult start, the team showed character and continued to compete against Poulos Manchester United side.',

      'K.O.T FC found the back of the net twice during the match, but ultimately fell 4-2 at the final whistle.',

      'Although the result did not go K.O.T FC’s way, the match provided valuable experience for the squad and marked another opportunity for the Kings Of Tomorrow to compete at a higher level.',

      'The team will now look to regroup, learn from the opening match and continue building as they prepare for their next challenge.'
    ],
  },
  // {
  //   slug: 'kot-fc-cruise-past-stellenbosch-in-league-clash',
  //   title: 'K.O.T FC Cruise Past Stellenbosch in Dominant League Display',
  //   excerpt: 'A clinical performance saw Kings Of Tomorrow FC secure a convincing 3-1 victory over Stellenbosch FC at K.O.T Stadium.',
  //   category: 'Match Report',
  //   date: '2026-07-25',
  //   image: heroImg,
  //   author: 'K.O.T Media Team',
  //   readTime: 3,
  //   content: [
  //     'Kings Of Tomorrow FC delivered a commanding performance at K.O.T Stadium, dispatching Stellenbosch FC with a 3-1 victory that underlined their title credentials.',
  //     'Captain Alfred Malope opened the scoring in the 23rd minute with a stunning strike from the edge of the box, setting the tone for a dominant first half. Katlego Molepo doubled the lead just before the break with a clinical finish following a sweeping team move.',
  //     'Stellenbosch pulled one back early in the second half, but K.O.T FC remained composed and reasserted control. Themba Nyathi sealed the three points with a breathtaking solo run and finish in the 78th minute.',
  //     'Head coach praised the team\u2019s discipline and attacking fluency after the match, highlighting the growing understanding between the forward units. The victory moves K.O.T FC closer to the summit of the Premier League table.',
  //   ],
  // },
  // {
  //   slug: 'squad-prepared-for-sundowns-showdown',
  //   title: 'Squad Prepared for Sundowns Showdown',
  //   excerpt: 'K.O.T FC head into their marquee fixture against Mamelodi Sundowns with a fully fit squad and growing confidence.',
  //   category: 'Team News',
  //   date: '2026-08-12',
  //   image: teamImg,
  //   author: 'K.O.T Media Team',
  //   readTime: 2,
  //   content: [
  //     'Kings Of Tomorrow FC are gearing up for one of their biggest fixtures of the season as they prepare to host Mamelodi Sundowns at K.O.T Stadium.',
  //     'The coaching staff have reported a clean bill of health across the squad, with every player available for selection. Training sessions this week have focused on tactical discipline and exploiting spaces in transition.',
  //     'Captain Alfred Malope addressed the media, emphasising the team\u2019s belief and the importance of the home support. The midfielder called on fans to turn out in numbers for what promises to be a thrilling contest.',
  //   ],
  // },
  // {
  //   slug: 'training-intensity-ramps-up-ahead-of-fixtures',
  //   title: 'Training Intensity Ramps Up Ahead of Crucial Fixture Run',
  //   excerpt: 'The K.O.T FC squad has been put through their paces in an intense week of training as the fixture list intensifies.',
  //   category: 'Training',
  //   date: '2026-08-10',
  //   image: trainingImg,
  //   author: 'K.O.T Media Team',
  //   readTime: 2,
  //   content: [
  //     'With a packed schedule approaching, the K.O.T FC coaching team has ramped up training intensity to ensure the squad is peak-ready for the challenges ahead.',
  //     'Sessions have included high-press drills, set-piece routines, and conditioning work designed to maintain sharpness across a demanding run of fixtures. The coaching staff have been pleased with the application and focus shown by every player.',
  //     'Youngsters from the development setup have also been integrated into first-team training, reflecting the club\u2019s commitment to nurturing the Kings Of Tomorrow.',
  //   ],
  // },
  // {
  //   slug: 'kot-fc-announce-new-merchandise-partnership',
  //   title: 'K.O.T FC Announce New Merchandise Partnership',
  //   excerpt: 'Kings Of Tomorrow FC have secured a new partnership that will bring official club merchandise to supporters.',
  //   category: 'Announcement',
  //   date: '2026-08-05',
  //   image: stadiumImg,
  //   author: 'K.O.T Media Team',
  //   readTime: 2,
  //   content: [
  //     'Kings Of Tomorrow FC are delighted to announce a new merchandise partnership that will see a range of official club kit and apparel made available to supporters.',
  //     'The collaboration will launch with the official K.O.T FC home and away kits, along with training wear and accessories. The club\u2019s crest and signature navy, blue, and gold colours feature prominently across the collection.',
  //     'Further details regarding availability and launch dates will be shared in the coming weeks. The club thanks its supporters for their continued passion and loyalty.',
  //   ],
  // },
  // {
  //   slug: 'dramatic-draw-away-at-sundowns',
  //   title: 'Dramatic Draw Away at Sundowns',
  //   excerpt: 'K.O.T FC secured a hard-fought point on the road with a 2-2 draw against Mamelodi Sundowns in a thrilling encounter.',
  //   category: 'Match Report',
  //   date: '2026-07-18',
  //   image: actionImg,
  //   author: 'K.O.T Media Team',
  //   readTime: 3,
  //   content: [
  //     'Kings Of Tomorrow FC showed tremendous character to earn a 2-2 draw away at Mamelodi Sundowns in one of the most entertaining matches of the season.',
  //     'Falling behind twice, K.O.T FC responded each time with grit and quality. The midfield battled relentlessly, and the forward line capitalised on counter-attacking opportunities to keep the scoreline level.',
  //     'The result extends K.O.T FC\u2019s unbeaten run and reinforces the growing belief within the squad that they can compete with the very best in the league.',
  //   ],
  // },
  // {
  //   slug: 'youth-academy-trials-announcement',
  //   title: 'Youth Academy Trials Announced for September',
  //   excerpt: 'K.O.T FC will hold open trials for its youth academy in September, searching for the next generation of Kings Of Tomorrow.',
  //   category: 'Club News',
  //   date: '2026-07-30',
  //   image: celebrationImg,
  //   author: 'K.O.T Media Team',
  //   readTime: 2,
  //   content: [
  //     'Kings Of Tomorrow FC have announced open trials for the club\u2019s youth academy, scheduled to take place in September 2026.',
  //     'The academy is central to the club\u2019s vision of building the future. Young players from the community will have the opportunity to showcase their talent and earn a place in the K.O.T development pathway.',
  //     'Registration details and trial dates will be published on the club\u2019s official channels. K.O.T FC reaffirms its commitment to identifying and nurturing talent from the grassroots level upward.',
  //   ],
  // },
];

export function getArticle(slug: string): NewsArticle | undefined {
  return news.find((a) => a.slug === slug);
}

export function getRelatedArticles(slug: string, limit = 3): NewsArticle[] {
  const article = getArticle(slug);
  if (!article) return [];
  return news
    .filter((a) => a.slug !== slug)
    .sort((a, b) => {
      const aMatch = a.category === article.category ? 0 : 1;
      const bMatch = b.category === article.category ? 0 : 1;
      return aMatch - bMatch;
    })
    .slice(0, limit);
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
