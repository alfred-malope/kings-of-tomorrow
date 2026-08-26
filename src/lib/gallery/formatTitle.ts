/**
 * Convert a folder slug into a human-readable gallery title.
 * "vs-mamelodi-sundowns" -> "VS MAMELODI SUNDOWNS"
 * "training_august_2026" -> "TRAINING AUGUST 2026"
 */
export function formatCategoryTitle(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.toUpperCase())
    .join(' ');
}
