/*
  Fotos mais leves: pede ao serviço da foto o tamanho certo e o melhor formato (WebP/AVIF).
  - Cloudinary: junta "f_auto,q_auto,w_LARGURA" ao endereço
  - Unsplash: muda ?w= e junta auto=format
  Outras fotos (ex.: guardadas no servidor, em /uploads) ficam como estão.
*/
const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

export const imgUrl = (src, width) => {
  if (!src || !width) return src;
  const c = CLOUDINARY.exec(src);
  if (c) {
    // Já tem transformações (ex.: "c_fill,w_200/")? Deixa como está.
    if (/^[a-z]{1,3}_[^/]*\//.test(c[2]) && !/^v\d+\//.test(c[2])) return src;
    return `${c[1]}f_auto,q_auto,c_limit,w_${width}/${c[2]}`;
  }
  if (src.startsWith('https://images.unsplash.com/')) {
    try {
      const u = new URL(src);
      u.searchParams.set('w', String(width));
      u.searchParams.set('auto', 'format');
      if (!u.searchParams.has('q')) u.searchParams.set('q', '75');
      return u.toString();
    } catch {
      return src;
    }
  }
  return src;
};

// Várias larguras para o navegador escolher (ecrãs pequenos descarregam menos)
export const imgSrcSet = (src, widths = [320, 480, 720, 960]) => {
  if (!src || imgUrl(src, widths[0]) === src) return undefined;
  return widths.map((w) => `${imgUrl(src, w)} ${w}w`).join(', ');
};
