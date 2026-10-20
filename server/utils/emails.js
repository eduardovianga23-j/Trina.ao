import { sendMail, storeEmail } from './mailer.js';

/*
  Emails automáticos das encomendas.
  Cada função recebe a encomenda com o utilizador (order.user com name e email).
*/

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (n) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
const site = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
const num = (order) => String(order._id).slice(-6).toUpperCase();
const firstName = (order) => esc(String(order.shippingAddress?.name || order.user?.name || '').split(' ')[0]);
// Compra sem conta: o link leva o código secreto da encomenda
const orderLink = (order) => `${site()}/encomenda/${order._id}${order.guestToken ? `?t=${order.guestToken}` : ''}`;

const button = (href, label) =>
  `<a href="${href}" style="display:inline-block;background:#991b1b;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:6px;font-size:14px">${label}</a>`;

const layout = (title, body) => `<!doctype html>
<html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden">
        <tr><td style="background:#000000;padding:18px 24px;text-align:center">
          <span style="color:#ffffff;font-size:26px;font-weight:bold;letter-spacing:3px">TRINA</span><br>
          <span style="color:#a1a1aa;font-size:9px;letter-spacing:4px">LIBERTA A SUA ESSÊNCIA</span>
        </td></tr>
        <tr><td style="padding:28px 24px;font-size:14px;line-height:1.6">${body}</td></tr>
        <tr><td style="padding:16px 24px;background:#fafafa;color:#71717a;font-size:11px;text-align:center">
          Recebeste este email por causa da tua conta ou de uma encomenda na Trina.<br>
          <a href="${site()}/termos" style="color:#71717a">Termos e Condições</a> · <a href="${site()}/privacidade" style="color:#71717a">Privacidade</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const itemsTable = (order) => {
  const rows = order.items.map((it) => {
    const details = [it.size && `Tamanho ${esc(it.size)}`, it.color?.name && esc(it.color.name), `${it.quantity} × ${eur(it.price)}`].filter(Boolean).join(' · ');
    const img = /^https:\/\//.test(it.image) ? `<img src="${esc(it.image)}" width="48" height="56" alt="" style="border-radius:4px;object-fit:cover;display:block">` : '';
    return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;width:56px">${img}</td>
      <td style="padding:8px 8px;border-bottom:1px solid #f4f4f5"><strong>${esc(it.name)}</strong><br><span style="color:#71717a;font-size:12px">${details}</span></td>
      <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;text-align:right;white-space:nowrap">${eur(it.price * it.quantity)}</td>
    </tr>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:13px">${rows}
    ${order.discount > 0 ? `<tr><td></td><td style="padding:8px;color:#15803d">Desconto ${esc(order.couponCode)}</td><td style="padding:8px 0;text-align:right;color:#15803d">−${eur(order.discount)}</td></tr>` : ''}
    <tr><td></td><td style="padding:8px;color:#71717a">Envio</td><td style="padding:8px 0;text-align:right">${order.shippingCost ? eur(order.shippingCost) : 'Grátis'}</td></tr>
    <tr><td></td><td style="padding:4px 8px;font-weight:bold;font-size:15px">Total</td><td style="padding:4px 0;text-align:right;font-weight:bold;font-size:15px">${eur(order.total)}</td></tr>
  </table>`;
};

const addressBlock = (order) => {
  const a = order.shippingAddress || {};
  return `<p style="margin:16px 0 0;padding:12px 14px;background:#fafafa;border-radius:6px;font-size:13px">
    <strong>Entrega</strong><br>${esc(a.name)}<br>${esc(a.street)}<br>${esc(a.postalCode)} ${esc(a.city)}, ${esc(a.country || 'Portugal')}<br>${esc(a.phone)}
  </p>`;
};

const toCustomer = (order) => order.user?.email || order.guestEmail;

// ---------- Cliente ----------

export const emailOrderPaid = (order) => sendMail({
  to: toCustomer(order),
  subject: `Encomenda #${num(order)} confirmada`,
  html: layout('Encomenda confirmada', `
    <h1 style="font-size:20px;margin:0 0 8px">Obrigado, ${firstName(order)}! 🎉</h1>
    <p style="margin:0">Recebemos o pagamento da tua encomenda <strong>#${num(order)}</strong>. Vamos prepará-la e avisamos-te por email quando for enviada.</p>
    ${itemsTable(order)}
    ${addressBlock(order)}
    <p style="margin:24px 0 0;text-align:center">${button(orderLink(order), 'Ver a minha encomenda')}</p>`),
});

export const emailMultibanco = (order) => {
  const mb = order.multibanco || {};
  const until = mb.expiresAt ? new Date(mb.expiresAt).toLocaleString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
  return sendMail({
    to: toCustomer(order),
    subject: `Dados para pagar a encomenda #${num(order)} (Multibanco)`,
    html: layout('Pagamento Multibanco', `
      <h1 style="font-size:20px;margin:0 0 8px">Falta só pagar, ${firstName(order)}</h1>
      <p style="margin:0">Paga no multibanco ou no homebanking com estes dados. Assim que o pagamento chegar, preparamos a tua encomenda.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:15px;background:#fafafa;border-radius:6px;width:100%">
        <tr><td style="padding:10px 14px;color:#71717a">Entidade</td><td style="padding:10px 14px;text-align:right;font-weight:bold;font-family:monospace;font-size:17px">${esc(mb.entity)}</td></tr>
        <tr><td style="padding:10px 14px;color:#71717a">Referência</td><td style="padding:10px 14px;text-align:right;font-weight:bold;font-family:monospace;font-size:17px">${esc(mb.reference)}</td></tr>
        <tr><td style="padding:10px 14px;color:#71717a">Montante</td><td style="padding:10px 14px;text-align:right;font-weight:bold;font-size:17px">${eur(order.total)}</td></tr>
      </table>
      ${until ? `<p style="margin:0;color:#71717a;font-size:12px">Paga até ${esc(until)}. Depois disso a referência deixa de funcionar.</p>` : ''}
      ${itemsTable(order)}
      <p style="margin:24px 0 0;text-align:center">${button(orderLink(order), 'Ver a minha encomenda')}</p>`),
  });
};

export const emailShipped = (order) => sendMail({
  to: toCustomer(order),
  subject: `A tua encomenda #${num(order)} está a caminho 🚚`,
  html: layout('Encomenda enviada', `
    <h1 style="font-size:20px;margin:0 0 8px">Está a caminho, ${firstName(order)}!</h1>
    <p style="margin:0">Enviámos a tua encomenda <strong>#${num(order)}</strong>.</p>
    ${order.trackingNumber ? `<p style="margin:16px 0;padding:12px 14px;background:#eef2ff;border-radius:6px">Número de seguimento: <strong style="font-family:monospace">${esc(order.trackingNumber)}</strong></p>` : ''}
    ${addressBlock(order)}
    <p style="margin:16px 0 0">Quando a receberes, confirma no site que chegou bem. Assim ficamos a saber e podes avaliar os produtos.</p>
    <p style="margin:24px 0 0;text-align:center">${button(orderLink(order), 'Acompanhar a encomenda')}</p>`),
});

export const emailDelivered = (order) => sendMail({
  to: toCustomer(order),
  subject: `Encomenda #${num(order)} entregue — já recebeste?`,
  html: layout('Encomenda entregue', `
    <h1 style="font-size:20px;margin:0 0 8px">A tua encomenda foi entregue 📦</h1>
    <p style="margin:0">Olá ${firstName(order)}, a encomenda <strong>#${num(order)}</strong> foi marcada como entregue.</p>
    <p style="margin:12px 0 0">Confirma no site que a recebeste e, se quiseres, deixa uma avaliação com fotos. Ajuda muito outras pessoas a comprar com confiança. 💛</p>
    <p style="margin:24px 0 0;text-align:center">${button(`${orderLink(order)}#avaliar`, order.user ? 'Confirmar e avaliar' : 'Confirmar que recebi')}</p>
    <p style="margin:16px 0 0;color:#71717a;font-size:12px">Ainda não recebeste? Responde a este email e nós ajudamos.</p>`),
});

export const emailCancelled = (order, reason = '') => sendMail({
  to: toCustomer(order),
  subject: `Encomenda #${num(order)} cancelada`,
  html: layout('Encomenda cancelada', `
    <h1 style="font-size:20px;margin:0 0 8px">Encomenda cancelada</h1>
    <p style="margin:0">Olá ${firstName(order)}, a encomenda <strong>#${num(order)}</strong> foi cancelada.${reason ? ` ${esc(reason)}` : ''}</p>
    ${order.paymentStatus === 'paid' ? '<p style="margin:12px 0 0">O valor pago vai ser devolvido pelo mesmo meio de pagamento. Pode demorar alguns dias a aparecer.</p>' : '<p style="margin:12px 0 0">Não foi cobrado nenhum valor.</p>'}
    <p style="margin:24px 0 0;text-align:center">${button(`${site()}/shop`, 'Voltar à loja')}</p>`),
});

// ---------- Loja (administrador) ----------

export const emailAdminNewOrder = (order, lowStock = []) => sendMail({
  to: storeEmail(),
  subject: `🛍️ Nova encomenda #${num(order)} — ${eur(order.total)}`,
  html: layout('Nova encomenda', `
    <h1 style="font-size:20px;margin:0 0 8px">Nova encomenda paga!</h1>
    <p style="margin:0"><strong>#${num(order)}</strong> de ${esc(order.shippingAddress?.name || order.user?.name)} (${esc(order.user?.email || order.guestEmail)}${order.user ? '' : ', sem conta'})</p>
    ${itemsTable(order)}
    ${addressBlock(order)}
    ${order.nif ? `<p style="margin:8px 0 0">NIF: <strong>${esc(order.nif)}</strong></p>` : ''}
    ${order.notes ? `<p style="margin:8px 0 0;padding:10px 14px;background:#fffbeb;border-radius:6px"><strong>Nota:</strong> ${esc(order.notes)}</p>` : ''}
    ${lowStock.length ? `<p style="margin:16px 0 0;padding:10px 14px;background:#fef2f2;border-radius:6px;color:#991b1b"><strong>⚠️ Stock baixo:</strong><br>${lowStock
      .map((l) => `${esc(l.name)}${l.size ? ` · ${esc(l.size)}` : ''}${l.color ? ` · ${esc(l.color)}` : ''}: ${l.left === 0 ? '<strong>esgotado</strong>' : `restam ${l.left}`}`).join('<br>')}</p>` : ''}
    <p style="margin:24px 0 0;text-align:center">${button(`${site()}/admin/encomendas`, 'Abrir no painel')}</p>`),
});

export const emailAdminReceived = (order) => sendMail({
  to: storeEmail(),
  subject: `✅ ${order.shippingAddress?.name || 'O cliente'} confirmou que recebeu a encomenda #${num(order)}`,
  html: layout('Entrega confirmada', `
    <h1 style="font-size:20px;margin:0 0 8px">Entrega confirmada pelo cliente</h1>
    <p style="margin:0">${esc(order.shippingAddress?.name || order.user?.name)} confirmou que recebeu a encomenda <strong>#${num(order)}</strong>.</p>
    <p style="margin:24px 0 0;text-align:center">${button(`${site()}/admin/encomendas`, 'Abrir no painel')}</p>`),
});

// Mensagem do formulário de contacto (responder ao email responde ao cliente)
export const emailContact = ({ name, email, subjectLabel, order, message, account }) => sendMail({
  to: storeEmail(),
  replyTo: `${name.replace(/[\r\n"<>]/g, '')} <${email}>`,
  subject: `✉️ ${subjectLabel}${order ? ` · encomenda ${order}` : ''} — ${name}`,
  html: layout('Nova mensagem', `
    <h1 style="font-size:20px;margin:0 0 8px">Nova mensagem do site</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:13px;margin:8px 0 16px">
      <tr><td style="padding:3px 12px 3px 0;color:#71717a">Nome</td><td><strong>${esc(name)}</strong></td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#71717a">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
      <tr><td style="padding:3px 12px 3px 0;color:#71717a">Assunto</td><td>${esc(subjectLabel)}</td></tr>
      ${order ? `<tr><td style="padding:3px 12px 3px 0;color:#71717a">Encomenda</td><td>${esc(order)}</td></tr>` : ''}
      <tr><td style="padding:3px 12px 3px 0;color:#71717a">Conta</td><td>${account ? 'Cliente com sessão iniciada' : 'Sem sessão iniciada'}</td></tr>
    </table>
    <div style="padding:14px;background:#fafafa;border-radius:6px;white-space:pre-wrap">${esc(message)}</div>
    <p style="margin:16px 0 0;color:#71717a;font-size:12px">Para responder, basta carregar em "Responder" no teu email.</p>`),
});

// ---------- Conta ----------

export const emailPasswordReset = (user, link, minutes) => sendMail({
  to: user.email,
  subject: 'Criar uma senha nova na Trina',
  html: layout('Senha nova', `
    <h1 style="font-size:20px;margin:0 0 8px">Olá ${esc(String(user.name || '').split(' ')[0])},</h1>
    <p style="margin:0">Pediste para criar uma senha nova. Carrega no botão para escolheres a tua senha nova:</p>
    <p style="margin:24px 0;text-align:center">${button(link, 'Criar senha nova')}</p>
    <p style="margin:0;color:#71717a;font-size:12px">O link funciona durante ${minutes} minutos e só pode ser usado uma vez.<br>
    Se não foste tu que pediste, ignora este email: a tua senha continua igual.</p>`),
});

export const emailPasswordChanged = (user) => sendMail({
  to: user.email,
  subject: 'A tua senha da Trina foi alterada',
  html: layout('Senha alterada', `
    <h1 style="font-size:20px;margin:0 0 8px">A tua senha foi alterada</h1>
    <p style="margin:0">A senha da tua conta (${esc(user.email)}) foi alterada agora. As sessões abertas noutros dispositivos foram terminadas.</p>
    <p style="margin:12px 0 0">Se não foste tu, recupera já o acesso com "Esqueci-me da senha" e fala connosco.</p>
    <p style="margin:24px 0 0;text-align:center">${button(`${site()}/recuperar-senha`, 'Não fui eu')}</p>`),
});

// ---------- Avisos de stock ----------

export const emailBackInStock = (alert, product) => {
  const opt = [alert.size && `tamanho ${esc(alert.size)}`, alert.color && esc(alert.color)].filter(Boolean).join(', ');
  const img = /^https:\/\//.test(product.colors?.find((c) => c.name === alert.color)?.image || product.images?.[0] || '')
    ? `<img src="${esc(product.colors?.find((c) => c.name === alert.color)?.image || product.images[0])}" width="180" alt="" style="border-radius:8px;display:block;margin:16px auto">` : '';
  const link = `${site()}/produto/${product.slug}${alert.color ? `?cor=${encodeURIComponent(alert.color)}` : ''}`;
  return sendMail({
    to: alert.email,
    subject: `Voltou! ${product.name}${opt ? ` (${opt.replace(/<[^>]+>/g, '')})` : ''} já está disponível`,
    html: layout('Voltou ao stock', `
      <h1 style="font-size:20px;margin:0 0 8px">Voltou ao stock! 🎉</h1>
      <p style="margin:0">Pediste para te avisarmos: <strong>${esc(product.name)}</strong>${opt ? ` (${opt})` : ''} já está disponível outra vez.</p>
      ${img}
      <p style="margin:0;color:#71717a;font-size:12px">As unidades são poucas e podem esgotar depressa.</p>
      <p style="margin:24px 0 0;text-align:center">${button(link, 'Comprar agora')}</p>`),
  });
};
