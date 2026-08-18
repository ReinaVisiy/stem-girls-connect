/**
 * Primary site navigation. Single source of truth for the Navbar link
 * list, so routes and labels can't drift out of sync between components.
 */
export const navigation = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Activities', path: '/activities' },
  { label: 'Join Us', path: '/join' },
  { label: 'Contact', path: '/contact' },
  { label: 'Donate', path: '/donate' },
] as const;
