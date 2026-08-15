/**
 * Build-time gallery discovery.
 *
 * Place photo folders under: src/assets/gallery/<folder-slug>/*.jpg
 *
 * Adding a new folder with photos automatically creates a new gallery album.
 * No manual registration required — Vite's import.meta.glob enumerates everything
 * at build time.
 *
 * Each folder slug is converted to a human-readable title via formatCategoryTitle.
 */
import { formatCategoryTitle } from './formatTitle';
import type { GalleryAlbum, GalleryImage } from './types';

// Eagerly import all gallery images so we can enumerate folders and files at build time.
// `eager: true` returns the resolved modules (with default export = URL string) synchronously.
// `query: '?url'` ensures we get the asset URL as a string.
const galleryModules: Record<string, string> = import.meta.glob<string>(
  '../../assets/gallery/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
);

export interface DiscoveredImage {
  src: string;
  folder: string;
  filename: string;
}

function discoverImages(): DiscoveredImage[] {
  const results: DiscoveredImage[] = [];

  for (const [path, url] of Object.entries(galleryModules)) {
    const match = path.match(
      /(?:\.\.\/)+assets\/gallery\/([^/]+)\/(.+)$/
    );

    if (match) {
      results.push({
        src: url,
        folder: match[1],
        filename: match[2],
      });
    }
  }

  return results;
}

function buildAlbums(): GalleryAlbum[] {
  const images = discoverImages();
  const folderMap = new Map<string, DiscoveredImage[]>();

  for (const img of images) {
    if (!folderMap.has(img.folder)) {
      folderMap.set(img.folder, []);
    }
    folderMap.get(img.folder)!.push(img);
  }

  const albums: GalleryAlbum[] = [];
  for (const [folder, folderImages] of folderMap) {
    folderImages.sort((a, b) => a.filename.localeCompare(b.filename));
    albums.push({
      slug: folder,
      title: formatCategoryTitle(folder),
      cover: folderImages[0].src,
      count: folderImages.length,
      images: folderImages.map((img) => ({
        src: img.src,
        alt: `${formatCategoryTitle(folder)} - ${img.filename}`,
        width: 1200,
        height: 800,
      })),
    });
  }

  albums.sort((a, b) => b.count - a.count);
  return albums;
}

export const galleryAlbums: GalleryAlbum[] = buildAlbums();

export function getAlbum(slug: string): GalleryAlbum | undefined {
  return galleryAlbums.find((a) => a.slug === slug);
}

export function getAlbumCount(): number {
  return galleryAlbums.length;
}
