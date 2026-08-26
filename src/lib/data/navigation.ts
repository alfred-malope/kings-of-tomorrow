export interface NavItem {
  label: string;
  path: string;
}

export const navItems: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Squad', path: '/squad' },
  { label: 'Fixtures', path: '/fixtures' },
  { label: 'News', path: '/news' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Contact', path: '/contact' },
];

export const ctaLabel = 'Follow K.O.T';
export const ctaUrl = 'https://instagram.com/kotfc';
