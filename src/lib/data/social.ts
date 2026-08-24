export interface SocialLink {
  platform: string;
  handle: string;
  url: string;
  icon: string;
}

export const socialLinks: SocialLink[] = [
  // {
  //   platform: 'Instagram',
  //   handle: '@kotfc',
  //   url: 'https://instagram.com/kotfc',
  //   icon: 'instagram',
  // },
  // {
  //   platform: 'X',
  //   handle: '@kotfc',
  //   url: 'https://x.com/kotfc',
  //   icon: 'x',
  // },
  {
    platform: 'Facebook',
    handle: 'Kings Of Tomorrow FC',
    url: 'https://www.facebook.com/share/14qLbp38FPo/?mibextid=wwXIfr',
    icon: 'facebook',
  },
  {
    platform: 'YouTube',
    handle: 'K.O.T FC',
    url: 'https://youtube.com/@kotfc',
    icon: 'youtube',
  },
  {
    platform: 'TikTok',
    handle: '@kotfc',
    url: 'https://tiktok.com/@kotfc',
    icon: 'tiktok',
  },
];
