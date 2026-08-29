/**
 * Primary site navigation. Single source of truth for the Navbar link
 * list, so routes and labels can't drift out of sync between components.
 */
export const navigation = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Activities', path: '/activities' },
  { label: 'Impact & Evidence', path: '/impact' },
  { label: 'Blog', path: '/blog' },
  { label: 'Join Us', path: '/join' },
  { label: 'Contact', path: '/contact' },
  { label: 'Donate', path: '/donate' },
] as const;
