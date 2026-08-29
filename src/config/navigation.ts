/**
 * Primary site navigation. Single source of truth for the Navbar link
 * list, so routes and labels can't drift out of sync between components.
 *
 * A plain item ({ label, path }) renders as a direct link. A group item
 * ({ label, children }) renders as a dropdown/accordion trigger with no
 * page of its own — only its children are real destinations.
 */
export interface NavLinkItem {
  label: string;
  path: string;
}

export interface NavGroupItem {
  label: string;
  children: NavLinkItem[];
}

export type NavItem = NavLinkItem | NavGroupItem;

export function isNavGroup(item: NavItem): item is NavGroupItem {
  return 'children' in item;
}

export const navigation: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  {
    label: 'What We Do',
    children: [
      { label: 'Programs', path: '/activities' },
      { label: 'Blog / News', path: '/blog' },
    ],
  },
  { label: 'Impact', path: '/impact' },
  {
    label: 'Get Involved',
    children: [
      { label: 'Join Us', path: '/join' },
      { label: 'Contact', path: '/contact' },
    ],
  },
];
