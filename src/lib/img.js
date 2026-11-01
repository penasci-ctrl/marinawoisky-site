// Imagens: no Sanity, o próprio CDN redimensiona e entrega webp/avif (?w=…&auto=format).
// No conteúdo inicial (public/seed), a imagem é servida como está.
const isSanity = (src) => typeof src === 'string' && src.includes('cdn.sanity.io');

export const imgUrl = (image, width) => {
  if (!image?.src) return '';
  return isSanity(image.src) ? `${image.src}?w=${width}&auto=format&q=82&fit=max` : image.src;
};

export const srcset = (image, widths = [480, 800, 1200, 1800, 2400]) => {
  if (!image?.src || !isSanity(image.src)) return undefined;
  return widths.filter((w) => !image.w || w <= image.w * 1.05).map((w) => `${imgUrl(image, w)} ${w}w`).join(', ');
};

export const ratio = (image) => (image?.w && image?.h ? image.w / image.h : 1.45);
