import React, { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export interface GalleryImage {
  src: string;
  alt?: string;
}

interface PhotoGalleryProps {
  images: GalleryImage[];
  children: (open: (index: number) => void) => React.ReactNode;
}

/**
 * Wrap any set of images with this to get click-to-enlarge behavior.
 * The render-prop gives you an `open(index)` function to attach to each
 * image's onClick; the lightbox itself (with prev/next through the same
 * `images` array) is rendered alongside your content.
 *
 * Usage:
 *   <PhotoGallery images={[{ src, alt }]}>
 *     {(open) => (
 *       <img src={src} alt={alt} onClick={() => open(0)} className="cursor-zoom-in" />
 *     )}
 *   </PhotoGallery>
 */
const PhotoGallery: React.FC<PhotoGalleryProps> = ({ images, children }) => {
  const [index, setIndex] = useState(-1);

  return (
    <>
      {children((i) => setIndex(i))}
      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={images.map((img) => ({ src: img.src, alt: img.alt }))}
        styles={{ container: { backgroundColor: 'rgba(0, 0, 0, 0.92)' } }}
      />
    </>
  );
};

export default PhotoGallery;
