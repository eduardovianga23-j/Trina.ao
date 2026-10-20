import Stripe from 'stripe';

/*
  Ligação ao Stripe (pagamentos: MB WAY, Multibanco, cartão, Apple Pay, Google Pay...).
  Basta pôr STRIPE_SECRET_KEY no server/.env. Sem a chave, a loja funciona mas não aceita pagamentos.
*/
let client = null;

export const stripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);

export const getStripe = () => {
  if (!stripeEnabled()) return null;
  if (!client) {
    const options = {};
    // Só para testes automáticos (servidor falso do Stripe). Não é preciso no dia a dia.
    if (process.env.STRIPE_API_URL) {
      const u = new URL(process.env.STRIPE_API_URL);
      Object.assign(options, { host: u.hostname, port: u.port, protocol: u.protocol.replace(':', '') });
    }
    client = new Stripe(process.env.STRIPE_SECRET_KEY, options);
  }
  return client;
};

// Mensagem simples para o cliente quando o Stripe falha
export const stripeMessage = (err) => {
  if (err?.type === 'StripeAuthenticationError') return 'A chave do Stripe está errada. Confirma STRIPE_SECRET_KEY no ficheiro server/.env.';
  if (err?.type === 'StripeConnectionError') return 'Não foi possível contactar o serviço de pagamentos. Tenta novamente.';
  return 'Não foi possível iniciar o pagamento. Tenta novamente daqui a pouco.';
};
