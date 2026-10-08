import { createContext, useContext } from 'react';
import { Link as RouterLink, NavLink as RouterNavLink, type LinkProps, type NavLinkProps } from 'react-router-dom';

export const GirlhoodRuntime = createContext<{
  preview: boolean;
  navigate?: (path: string) => void;
  request: typeof fetch;
}>({ preview: false, request: (input, init) => fetch(input, init) });
export const useGirlhoodRuntime = () => useContext(GirlhoodRuntime);

export function Link(props: LinkProps) {
  const runtime = useGirlhoodRuntime();
  return <RouterLink {...props} onClick={(event) => {
    if (runtime.preview) { event.preventDefault(); runtime.navigate?.(String(props.to)); }
    else props.onClick?.(event);
  }} />;
}
export function NavLink(props: NavLinkProps) {
  const runtime = useGirlhoodRuntime();
  return <RouterNavLink {...props} onClick={(event) => {
    if (runtime.preview) { event.preventDefault(); runtime.navigate?.(String(props.to)); }
    else props.onClick?.(event);
  }} />;
}
