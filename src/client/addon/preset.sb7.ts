export const previewAnnotations = (entry = []): string[] => {
  return [...entry, require.resolve('./preview')];
};

export function managerEntries(entry: string[] = []): string[] {
  return [...entry, require.resolve('./register')];
}
