/**
 * Converts a Unix timestamp to a release year
 * @param timestamp Unix timestamp (seconds since epoch)
 * @returns Release year as number, or null if invalid
 */
export function getGameReleaseYear(timestamp?: number | null): number | null {
  if (!timestamp) return null;
  try {
    return new Date(timestamp * 1000).getFullYear();
  } catch {
    return null;
  }
}

/**
 * Formats a game title with release year
 * @param title Game title
 * @param releaseDate Unix timestamp of release date
 * @returns Formatted string like "Game Title (2023)" or just "Game Title"
 */
export function formatGameTitleWithYear(title: string, releaseDate?: number | null): string {
  const year = getGameReleaseYear(releaseDate);
  return year ? `${title} (${year})` : title;
}
