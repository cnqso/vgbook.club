
export function getGameReleaseYear(timestamp?: number | null): number | null {
  if (!timestamp) return null;
  try {
    return new Date(timestamp * 1000).getFullYear();
  } catch {
    return null;
  }
}

export function formatGameTitleWithYear(title: string, releaseDate?: number | null): string {
  const year = getGameReleaseYear(releaseDate);
  return year ? `${title} (${year})` : title;
}
