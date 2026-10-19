// 24.9 -> "24,90 €"
const eur = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
export const formatEUR = (value) => eur.format(Number(value) || 0);

// Desconto em percentagem (ex.: -23)
export const discountPercent = (price, originalPrice) =>
  originalPrice && originalPrice > price ? -Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

export const CATEGORIES = [
  { value: 'roupas', label: 'Roupas' },
  { value: 'sapatos', label: 'Sapatos' },
  { value: 'acessórios', label: 'Acessórios' },
  { value: 'bolsas', label: 'Bolsas' },
  { value: 'joias', label: 'Joias' },
  { value: 'praia', label: 'Praia' },
  { value: 'desporto', label: 'Desporto' },
  { value: 'outros', label: 'Outros' },
];
export const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label || value;
