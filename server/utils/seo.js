import fs from 'fs';
import Product from '../models/Product.js';
import { CATEGORIES } from '../models/Product.js';

/*
  Google e partilhas (WhatsApp, Instagram, Facebook...).
  Quem partilha um link não corre o JavaScript do site, por isso o servidor escreve no index.html
  o título, a descrição e a foto de cada página antes de o enviar.
*/
const SITE_NAME = 'Trina';
const TAGLINE = 'Liberta a tua essência';
const DEFAULT_DESC = 'Loja online de moda: roupa, calçado e acessórios com envio para todo Portugal. Paga com MB WAY, Multibanco ou cartão.';

export const siteUrl = () => (process.env.CLIENT_URL || 'http://localhost:5000').replace(/\/+$/, '');
const abs = (u) => (!u ? '' : /^https?:\/\//.test(u) ? u : `${siteUrl()}${u.startsWith('/') ? '' : '/'}${u}`);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const CAT_LABEL = { roupas: 'Roupas', sapatos: 'Sapatos', 'acessórios': 'Acessórios', bolsas: 'Bolsas', joias: 'Joias', praia: 'Praia', desporto: 'Desporto', outros: 'Outros' };

// Páginas privadas: não aparecem no Google
const PRIVATE = /^\/(admin|conta|checkout|encomenda|cart|login|register|recuperar-senha|nova-senha|favoritos)(\/|$)/;

const STATIC = {
  '/': { title: `${SITE_NAME} — ${TAGLINE}`, description: DEFAULT_DESC },
  '/shop': { title: `Loja — ${SITE_NAME}`, description: 'Vê todos os produtos da Trina: vestidos, conjuntos, sapatos, óculos e acessórios. Envio grátis a partir de 50 €.' },
  '/contactos': { title: `Contactos — ${SITE_NAME}`, description: 'Fala connosco: dúvidas sobre encomendas, tamanhos, trocas e devoluções.' },
  '/envios-devolucoes': { title: `Envios e Devoluções — ${SITE_NAME}`, description: 'Prazos de entrega, portes, como acompanhar a encomenda e como devolver em 14 dias.' },
  '/privacidade': { title: `Política de Privacidade — ${SITE_NAME}`, description: 'Como a Trina trata os teus dados pessoais.' },
  '/termos': { title: `Termos e Condições — ${SITE_NAME}`, description: 'Regras de compra na loja online Trina.' },
};

export const pageMeta = async (pathname, query = {}) => {
  const url = `${siteUrl()}${pathname}`;
  const base = { url, image: abs('/og-trina.jpg'), type: 'website', noindex: PRIVATE.test(pathname), ...STATIC['/'] };

  const m = pathname.match(/^\/produto\/([^/]+)\/?$/);
  if (m) {
    const product = await Product.findOne({ slug: decodeURIComponent(m[1]), active: true })
      .select('name description images price originalPrice category slug rating numReviews trackStock stock colors')
      .lean().catch(() => null);
    if (!product) return { ...base, title: `Produto não encontrado — ${SITE_NAME}`, noindex: true, status: 404 };
    const color = product.colors?.find((c) => c.name === query.cor);
    const image = abs(color?.image || product.images?.[0]);
    const price = product.price.toFixed(2);
    const inStock = !product.trackStock || product.stock > 0;
    const purl = `${siteUrl()}/produto/${product.slug}`;
    return {
      ...base,
      url: purl,
      type: 'product',
      title: `${product.name} — ${price.replace('.', ',')} € | ${SITE_NAME}`,
      description: clip(product.description, 155) || `${product.name} na loja online Trina.`,
      image,
      price,
      inStock,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: clip(product.description, 500),
        image: (product.images || []).map(abs),
        category: CAT_LABEL[product.category] || product.category,
        brand: { '@type': 'Brand', name: SITE_NAME },
        offers: {
          '@type': 'Offer',
          url: purl,
          priceCurrency: 'EUR',
          price,
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
        ...(product.numReviews > 0 && {
          aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.numReviews },
        }),
      },
    };
  }

  if (pathname === '/shop' && query.category && CAT_LABEL[query.category]) {
    return { ...base, title: `${CAT_LABEL[query.category]} — ${SITE_NAME}`, description: `${CAT_LABEL[query.category]} na loja online Trina, com envio para todo Portugal.`, url: `${url}?category=${encodeURIComponent(query.category)}` };
  }
  return { ...base, ...(STATIC[pathname] || {}) };
};

// Escreve as informações no <head> do index.html
export const renderIndex = (template, meta) => {
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(meta.url)}" />`,
    meta.noindex && '<meta name="robots" content="noindex, nofollow" />',
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="pt_PT" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    meta.image && `<meta property="og:image" content="${esc(meta.image)}" />`,
    meta.price && `<meta property="product:price:amount" content="${meta.price}" />`,
    meta.price && '<meta property="product:price:currency" content="EUR" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    meta.jsonLd && `<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].filter(Boolean).join('\n    ');
  return template
    // tira as informações genéricas do index.html e põe as desta página
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/\s*<meta (name="description"|property="og:[^"]+"|name="twitter:card")[^>]*>/g, '')
    .replace('</head>', `    ${tags}\n  </head>`);
};

export const robotsTxt = () => `User-agent: *
Disallow: /admin
Disallow: /conta
Disallow: /checkout
Disallow: /encomenda
Disallow: /cart
Disallow: /api/
Allow: /

Sitemap: ${siteUrl()}/sitemap.xml
`;

export const sitemapXml = async () => {
  const products = await Product.find({ active: true }).select('slug updatedAt').lean();
  const urls = [
    ...['/', '/shop', '/contactos', '/envios-devolucoes', '/privacidade', '/termos'].map((p) => ({ loc: `${siteUrl()}${p}` })),
    ...CATEGORIES.map((c) => ({ loc: `${siteUrl()}/shop?category=${encodeURIComponent(c)}` })),
    ...products.map((p) => ({ loc: `${siteUrl()}/produto/${p.slug}`, lastmod: p.updatedAt?.toISOString().slice(0, 10) })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
};

export const readTemplate = (file) => fs.readFileSync(file, 'utf8');
