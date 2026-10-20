/*
  Portes de envio (em euros). Podes mudar no server/.env:
    SHIPPING_COST=3.99                 Portugal continental
    FREE_SHIPPING_FROM=50              envio grátis a partir deste valor (0 = nunca grátis)
    SHIPPING_COST_ISLANDS=6.99         Açores e Madeira
    FREE_SHIPPING_FROM_ISLANDS=80      envio grátis para as ilhas a partir deste valor (0 = nunca grátis)

  A zona sai do código postal: 9000-9499 = Madeira · 9500-9999 = Açores · o resto = Continente.
*/
const num = (value, fallback) => {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const ZONES = { continente: 'Portugal continental', madeira: 'Madeira', acores: 'Açores' };

export const zoneFor = (postalCode = '') => {
  const n = Number(String(postalCode).trim().slice(0, 4));
  if (!/^\d{4}/.test(String(postalCode).trim())) return 'continente';
  if (n >= 9500) return 'acores';
  if (n >= 9000) return 'madeira';
  return 'continente';
};

export const shippingConfig = () => {
  const cost = num(process.env.SHIPPING_COST, 3.99);
  const freeFrom = num(process.env.FREE_SHIPPING_FROM, 50);
  return {
    cost,
    freeFrom,
    islands: {
      cost: num(process.env.SHIPPING_COST_ISLANDS, 6.99),
      freeFrom: num(process.env.FREE_SHIPPING_FROM_ISLANDS, 80),
    },
  };
};

const ruleFor = (zone) => {
  const c = shippingConfig();
  return zone === 'continente' ? { cost: c.cost, freeFrom: c.freeFrom } : c.islands;
};

// Portes para um subtotal. Sem código postal, usa os preços do continente.
export const shippingFor = (subtotal, postalCode = '') => {
  const { cost, freeFrom } = ruleFor(zoneFor(postalCode));
  return freeFrom > 0 && subtotal >= freeFrom ? 0 : cost;
};
