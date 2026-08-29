import React from 'react';

interface TikTokIconProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * lucide-react has no TikTok brand icon (it's a generic icon set,
 * not a brand-logo set). This is a small inline SVG of the TikTok
 * glyph, sized/styled to match the other lucide icons used in
 * Footer.tsx social buttons.
 */
const TikTokIcon: React.FC<TikTokIconProps> = ({ size = 18, color = 'currentColor', className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.5 3c.3 1.9 1.5 3.5 3.5 4v3c-1.3 0-2.5-.4-3.5-1.1v6.4c0 3.1-2.5 5.7-5.7 5.7S5.1 18.4 5.1 15.3c0-3 2.4-5.5 5.4-5.7v3.2c-1.3.2-2.3 1.3-2.3 2.6 0 1.4 1.2 2.6 2.6 2.6s2.6-1.2 2.6-2.6V3h3.1Z"
      fill={color}
    />
  </svg>
);

export default TikTokIcon;
