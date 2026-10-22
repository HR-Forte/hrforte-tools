export function joinUrl(base?: string, ...paths: string[]) {
  const cleanBase = base?.replace(/\/$/, '') || '';
  const cleanPaths = paths.map(path => path.replace(/^\//, ''));

  return `${cleanBase}/${cleanPaths.join('/')}`;
}
