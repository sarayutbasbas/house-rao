// Legacy house URLs can still be opened from old Home Screen shortcuts.
export function primaryPath(pathname: string, houseId: string) {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path === `/${houseId}` || path === '/') return '/home';
  if (path === `/${houseId}/history`) return '/history';
  if (path === `/${houseId}/settings`) return '/settings';
  return path;
}
export const primaryRoutes = ['/home', '/shopping', '/inventory', '/history', '/settings'];
