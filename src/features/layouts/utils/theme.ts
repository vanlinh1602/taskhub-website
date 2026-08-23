export function getNextTheme(
  resolvedTheme: string | undefined,
): 'dark' | 'light' {
  return resolvedTheme === 'dark' ? 'light' : 'dark';
}
