/*
  Descobre a cor principal do produto numa foto.
  - Analisa o centro da imagem (onde normalmente está o produto).
  - Agrupa cores parecidas e escolhe o grupo com mais píxeis.
  - Dá menos importância a fundos brancos, cinzentos claros e quase pretos,
    a não ser que o produto seja mesmo dessa cor (ex.: uma camisola preta).
  Devolve "#RRGGBB" ou null se não conseguir ler a foto.
*/

const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // necessário para ler píxeis de fotos noutro domínio (ex.: Cloudinary)
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export async function dominantColor(src) {
  try {
    const img = await loadImage(src);
    const size = 80;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    // Só o centro: 60% da largura e da altura
    const sw = img.naturalWidth * 0.6;
    const sh = img.naturalHeight * 0.6;
    ctx.drawImage(img, img.naturalWidth * 0.2, img.naturalHeight * 0.2, sw, sh, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 128) continue;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const light = (max + min) / 2;
      const sat = max === 0 ? 0 : (max - min) / max;
      // Fundo típico de fotografia: muito claro e sem cor
      const isBackground = light > 225 && sat < 0.12;
      const weight = isBackground ? 0.15 : sat < 0.1 ? 0.6 : 1;
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const bk = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
      bk.n += weight;
      bk.r += r * weight;
      bk.g += g * weight;
      bk.b += b * weight;
      buckets.set(key, bk);
    }
    let best = null;
    for (const bk of buckets.values()) if (!best || bk.n > best.n) best = bk;
    return best ? toHex(best.r / best.n, best.g / best.n, best.b / best.n) : null;
  } catch {
    return null;
  }
}

// Nome aproximado para sugerir (o admin pode mudar)
const NAMES = [
  ['Preto', [20, 20, 20]], ['Branco', [245, 245, 245]], ['Cinzento', [128, 128, 128]],
  ['Vermelho', [200, 30, 40]], ['Bordô', [120, 20, 40]], ['Rosa', [240, 130, 170]],
  ['Laranja', [240, 130, 30]], ['Amarelo', [240, 210, 40]], ['Verde', [40, 140, 70]],
  ['Azul', [40, 90, 200]], ['Azul-marinho', [20, 30, 80]], ['Azul-claro', [130, 190, 235]],
  ['Lilás', [180, 120, 200]], ['Roxo', [110, 40, 140]], ['Castanho', [120, 75, 40]],
  ['Bege', [215, 195, 160]], ['Dourado', [200, 160, 60]],
];
export function suggestColorName(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return '';
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  let best = NAMES[0];
  let bestD = Infinity;
  for (const entry of NAMES) {
    const [nr, ng, nb] = entry[1];
    const d = 2 * (r - nr) ** 2 + 4 * (g - ng) ** 2 + 3 * (b - nb) ** 2;
    if (d < bestD) { bestD = d; best = entry; }
  }
  return best[0];
}
