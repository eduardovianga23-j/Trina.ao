/*
  Portes de envio (em euros). Podes mudar no server/.env:
    SHIPPING_COST=3.99        preço do envio
    FREE_SHIPPING_FROM=50     envio grátis a partir deste valor (0 = nunca grátis)
*/
const num = (value, fallback) => {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const shippingConfig = () => ({
  cost: num(process.env.SHIPPING_COST, 3.99),
  freeFrom: num(process.env.FREE_SHIPPING_FROM, 50),
});

export const shippingFor = (subtotal) => {
  const { cost, freeFrom } = shippingConfig();
  return freeFrom > 0 && subtotal >= freeFrom ? 0 : cost;
};
