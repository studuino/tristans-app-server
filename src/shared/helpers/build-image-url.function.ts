import env from 'conf/env';

/**
 * Build's how the url should look when requesting an image from the client
 * @todo Write unit tests in the routes that use this function to ensure it functions correctly
 * @param  imagePath path stored in record in database
 * @return           Image url
 */
export function buildImageUrl(imagePath: string): string {
  if (imagePath.slice(0, 4) === 'http') return imagePath; // If a test image

  return `${env.host}/api/canvas/image/${imagePath}`;
}
