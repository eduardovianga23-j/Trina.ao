/*
  Faturas certificadas pela AT, emitidas automaticamente pelo InvoiceXpress (https://invoicexpress.com).
  Quando uma encomenda é paga: cria uma fatura-recibo, finaliza-a e envia o PDF por email ao cliente.

  Para ligar, no server/.env:
    INVOICEXPRESS_ACCOUNT=nome-da-conta   (o que aparece antes de .app.invoicexpress.com)
    INVOICEXPRESS_API_KEY=...             (Definições → API no InvoiceXpress)
  Opcional:
    INVOICE_VAT_RATE=23                   taxa de IVA dos produtos (os preços da loja já incluem IVA)
    INVOICE_TAX_NAME=IVA23                nome da taxa no InvoiceXpress
    INVOICE_SEND_EMAIL=1                  0 = não envia a fatura por email ao cliente

  Sem configuração, a loja funciona normalmente e simplesmente não emite faturas.
  ⚠️ Confirma a primeira fatura com o teu contabilista (taxa de IVA, ilhas, isenções).
*/

export const invoicingEnabled = () => Boolean(process.env.INVOICEXPRESS_ACCOUNT && process.env.INVOICEXPRESS_API_KEY);

/*
  As faturas certificadas não se podem apagar. Por isso, enquanto o Stripe estiver em modo de teste
  (chave sk_test_), as compras de teste NÃO emitem fatura automaticamente.
  Para experimentar com uma conta de testes do InvoiceXpress: INVOICE_WITH_TEST_PAYMENTS=1
*/
export const autoInvoicing = () =>
  invoicingEnabled() && (String(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live') || process.env.INVOICE_WITH_TEST_PAYMENTS === '1');

const baseUrl = () =>
  // INVOICEXPRESS_API_URL só é usado nos testes automáticos
  (process.env.INVOICEXPRESS_API_URL || `https://${process.env.INVOICEXPRESS_ACCOUNT}.app.invoicexpress.com`).replace(/\/+$/, '');

const vatRate = () => {
  const n = Number(process.env.INVOICE_VAT_RATE);
  return Number.isFinite(n) && n >= 0 && n < 100 ? n : 23;
};
const taxName = () => process.env.INVOICE_TAX_NAME || `IVA${vatRate()}`;

const call = async (method, path, body) => {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${baseUrl()}${path}${sep}api_key=${encodeURIComponent(process.env.INVOICEXPRESS_API_KEY)}`, {
    method,
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* resposta sem JSON */ }
  if (!res.ok) {
    const detail = data?.errors ? JSON.stringify(data.errors) : text.slice(0, 200);
    const hint = res.status === 401 ? ' (chave da API errada)' : res.status === 404 ? ' (conta ou documento não encontrado)' : '';
    throw new Error(`InvoiceXpress respondeu ${res.status}${hint}${detail ? `: ${detail}` : ''}`);
  }
  return data;
};

const ddmmyyyy = (d) => {
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`;
};

// Os preços da loja incluem IVA; o InvoiceXpress recebe o preço sem IVA e acrescenta a taxa
const net = (gross) => Math.round((Number(gross) / (1 + vatRate() / 100)) * 10000) / 10000;

export const buildInvoice = (order) => {
  const a = order.shippingAddress || {};
  const ref = String(order._id).slice(-6).toUpperCase();
  // Código de desconto: reparte o desconto pelas linhas (em cêntimos), para o total da fatura ser o valor pago
  const lineC = order.items.map((it) => Math.round(it.price * 100) * it.quantity);
  const subtotalC = lineC.reduce((a, n) => a + n, 0);
  const discountC = Math.round((order.discount || 0) * 100);
  let left = discountC;
  const afterC = lineC.map((c, i) => {
    const share = i === lineC.length - 1 ? left : Math.round((discountC * c) / (subtotalC || 1));
    left -= share;
    return c - share;
  });
  const items = order.items.map((it, i) => ({
    // O InvoiceXpress guarda os artigos pelo nome: inclui tamanho e cor para não misturar
    name: [it.name, it.size, it.color?.name].filter(Boolean).join(' · ').slice(0, 60),
    description: [it.name, it.size && `Tamanho ${it.size}`, it.color?.name && `Cor ${it.color.name}`,
      discountC > 0 && `Desconto ${order.couponCode}`].filter(Boolean).join(' · ').slice(0, 200),
    unit_price: net(afterC[i] / 100 / it.quantity),
    quantity: it.quantity,
    tax: { name: taxName() },
  }));
  if (order.shippingCost > 0) {
    items.push({ name: 'Portes de envio', description: 'Envio para Portugal', unit_price: net(order.shippingCost), quantity: 1, tax: { name: taxName() } });
  }
  const today = ddmmyyyy(order.paidAt || new Date());
  return {
    invoice: {
      date: today,
      due_date: today,
      reference: `Encomenda #${ref}`,
      observations: `Encomenda online #${ref}`,
      client: {
        // Com NIF: um cliente por NIF. Sem NIF: um cliente por conta (fatura a "consumidor final" com o nome)
        name: a.name || order.user?.name || 'Consumidor final',
        code: order.nif ? `NIF-${order.nif}` : order.user ? `CONTA-${String(order.user?._id || order.user)}` : `EMAIL-${order.guestEmail}`.slice(0, 60),
        email: order.user?.email || order.guestEmail || '',
        ...(order.nif && { fiscal_id: order.nif }),
        address: a.street || '',
        postal_code: a.postalCode || '',
        city: a.city || '',
        country: 'Portugal',
      },
      items,
    },
  };
};

// Cria, finaliza e (opcionalmente) envia por email. Devolve { id, number, permalink }
export const issueInvoice = async (order) => {
  const created = await call('POST', '/invoice_receipts.json', buildInvoice(order));
  const doc = created?.invoice_receipt || created?.invoice || {};
  if (!doc.id) throw new Error('O InvoiceXpress não devolveu o número do documento');
  const done = await call('PUT', `/invoice_receipts/${doc.id}/change-state.json`, { invoice: { state: 'finalized' } });
  const fin = done?.invoice_receipt || done?.invoice || {};
  const sendTo = order.user?.email || order.guestEmail;
  if (process.env.INVOICE_SEND_EMAIL !== '0' && sendTo) {
    await call('PUT', `/invoice_receipts/${doc.id}/email-document.json`, {
      message: {
        client: { email: sendTo, save: '0' },
        subject: `Fatura da tua encomenda Trina #${String(order._id).slice(-6).toUpperCase()}`,
        body: 'Olá! Segue em anexo a fatura da tua encomenda. Obrigado por comprares na Trina.',
      },
    }).catch((err) => console.error('🧾 Fatura emitida mas o email falhou:', err.message));
  }
  return { id: doc.id, number: fin.inverted_sequence_number || fin.sequence_number || doc.sequence_number || '', permalink: fin.permalink || doc.permalink || '' };
};

// Endereço do PDF (para o cliente e o admin descarregarem)
export const invoicePdfUrl = async (invoiceId) => {
  for (let i = 0; i < 5; i++) {
    const data = await call('GET', `/api/pdf/${invoiceId}.json`);
    if (data?.output?.pdfUrl) return data.output.pdfUrl;
    await new Promise((r) => setTimeout(r, 1500)); // 202: o PDF ainda está a ser gerado
  }
  throw new Error('O PDF da fatura ainda não está pronto. Tenta daqui a pouco.');
};
