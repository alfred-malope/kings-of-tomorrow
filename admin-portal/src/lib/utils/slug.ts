/**
 * Converts a title into a URL-safe slug.
 *
 * The output is lowercase, with runs of non-alphanumeric characters collapsed
 * into single hyphens and no leading or trailing hyphens. The result always
 * matches `^[a-z0-9]+(-[a-z0-9]+)*$` or is the empty string.
 *
 * @param title - The source title to slugify.
 * @returns A URL-safe slug, or an empty string when the title contains no
 *          alphanumeric characters.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    // Replace any run of characters that are not lowercase letters or digits
    // with a single hyphen.
    .replace(/[^a-z0-9]+/g, '-')
    // Strip leading and trailing hyphens produced by the replacement above.
    .replace(/^-+|-+$/g, '');
}
