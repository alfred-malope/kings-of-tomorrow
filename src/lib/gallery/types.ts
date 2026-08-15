export interface GalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface GalleryAlbum {
  slug: string;
  title: string;
  cover: string;
  count: number;
  images: GalleryImage[];
}
