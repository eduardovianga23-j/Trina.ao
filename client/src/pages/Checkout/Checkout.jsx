import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FaLock, FaArrowLeft } from 'react-icons/fa';
import Header from '../../assets/components/header/Header';
import TopHeader from '../../assets/components/topheader/TopHeader';
import Footer from '../../assets/components/footer/footer';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderAPI, apiError } from '../../services/api';
import { formatEUR } from '../../utils/format';
import { useShipping, shippingFor, zoneFor, ZONE_LABEL } from '../../utils/orders';
import { imgUrl } from '../../utils/img';

/*
  Checkout: o cliente indica a morada de entrega e segue para a página segura do Stripe,
  onde escolhe MB WAY, Multibanco, cartão, Apple Pay ou Google Pay.
*/
const EMPTY = { name: '', phone: '', street: '', postalCode: '', city: '' };

// "1100053" -> "1100-053"
const formatPostal = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 7);
  return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d;
};

const validNif = (nif) => {
  if (!/^\d{9}$/.test(nif)) return false;
  const sum = [...nif.slice(0, 8)].reduce((acc, d, i) => acc + Number(d) * (9 - i), 0);
  const check = 11 - (sum % 11);
  return (check >= 10 ? 0 : check) === Number(nif[8]);
};

const validate = (a, nif) => {
  const e = {};
  if (a.name.trim().length < 3) e.name = 'Indica o nome de quem vai receber';
  if (!/^\+?\d{9,15}$/.test(a.phone.replace(/[\s().-]/g, ''))) e.phone = 'Número de telemóvel inválido';
  if (a.street.trim().length < 5) e.street = 'Indica a rua, o número e o andar';
  if (!/^\d{4}-\d{3}$/.test(a.postalCode)) e.postalCode = 'Formato 1234-567';
  if (a.city.trim().length < 2) e.city = 'Indica a localidade';
  if (nif && !validNif(nif.replace(/\s/g, ''))) e.nif = 'NIF inválido';
  return e;
};

const Field = ({ id, label, error, hint, className = '', ...props }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-sm font-semibold mb-1">{label}</label>
    <input
      id={id}
      {...props}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-err` : undefined}
      className={`w-full border rounded-md px-3 py-2.5 text-base sm:text-sm outline-none focus:border-black ${error ? 'border-red-600' : 'border-zinc-300'}`}
    />
    {error ? <p id={`${id}-err`} className="text-xs text-red-700 mt-1">{error}</p> : hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
  </div>
);

const Checkout = () => {
  const { items, total, count } = useCart();
  const { user } = useAuth();
  const guest = !user; // compra sem conta
  const [guestEmail, setGuestEmail] = useState('');
  const shipping = useShipping();
  const [address, setAddress] = useState({ ...EMPTY, name: user?.name || '' });
  // Os portes dependem da zona (continente, Madeira ou Açores), que sai do código postal completo
  const fullPostal = /^\d{4}-\d{3}$/.test(address.postalCode) ? address.postalCode : '';
  const zone = zoneFor(fullPostal);
  const envio = shippingFor(shipping, total, fullPostal);

  const [nif, setNif] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState('');

  // Código de desconto e preços calculados pelo servidor
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(''); // código aplicado
  const [couponError, setCouponError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [quote, setQuote] = useState(null);
  const cartLines = items.map((i) => ({ product: i.productId, quantity: i.quantity, size: i.size, color: i.color }));
  const cartKey = JSON.stringify(cartLines);

  const loadQuote = async (code) => {
    const { data } = await orderAPI.quote(cartLines, code || undefined, guest ? guestEmail.trim() : undefined, fullPostal || undefined);
    setQuote(data);
    return data;
  };
  useEffect(() => {
    if (!count) return;
    loadQuote(coupon).catch((err) => {
      // O código deixou de servir (ex.: o carrinho mudou): tira-o e mostra o motivo
      if (coupon && err.response?.data?.field === 'coupon') {
        setCoupon('');
        setCouponError(apiError(err));
      } else setQuote(null);
    });
  }, [cartKey, coupon, zone]);

  const applyCoupon = async (e) => {
    e?.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponBusy(true);
    setCouponError('');
    try {
      await loadQuote(code);
      setCoupon(code);
      setCouponInput('');
    } catch (err) {
      setCouponError(apiError(err, 'Não foi possível aplicar o código.'));
    } finally {
      setCouponBusy(false);
    }
  };

  useEffect(() => {
    document.title = 'Finalizar compra — Trina';
    if (!user) return () => { document.title = 'Trina.ao — Liberta a tua essência'; };
    // Preenche com a morada da última encomenda
    orderAPI.getMyOrders()
      .then(({ data }) => {
        const last = data.find((o) => o.shippingAddress?.street);
        if (last) {
          const { name, phone, street, postalCode, city } = last.shippingAddress;
          setAddress((a) => (a.street ? a : { name: name || a.name, phone: phone || '', street, postalCode: postalCode || '', city: city || '' }));
          if (last.nif) setNif((n) => n || last.nif);
        }
      })
      .catch(() => {});
    return () => { document.title = 'Trina.ao — Liberta a tua essência'; };
  }, [user?._id]);

  if (count === 0 && !sending) return <Navigate to="/cart" replace />;

  const set = (k) => (e) => {
    const value = k === 'postalCode' ? formatPostal(e.target.value) : e.target.value;
    setAddress((a) => ({ ...a, [k]: value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    const found = validate(address, nif);
    if (guest && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) found.email = 'Indica o teu email para receberes a confirmação';
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`co-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setSending(true);
    try {
      const { data } = await orderAPI.checkout({
        shippingAddress: address,
        nif: nif.replace(/\s/g, ''),
        ...(guest && { email: guestEmail.trim() }),
        notes,
        items: cartLines,
        couponCode: coupon || undefined,
      });
      window.location.assign(data.url); // página segura do Stripe
    } catch (err) {
      setServerError(apiError(err, 'Não foi possível iniciar o pagamento. Tenta novamente.'));
      setSending(false);
    }
  };

  const paymentsOff = shipping && !shipping.payments;

  return (
    <>
      <TopHeader />
      <Header />
      <main className="mt-[110px] bg-zinc-50 min-h-[70vh]">
        <div className="container-site py-6 sm:py-10">
          <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-black">
            <FaArrowLeft className="text-xs" aria-hidden="true" /> Voltar ao carrinho
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-3">Finalizar compra</h1>

          <div className="mt-6 grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-10 items-start">
            {/* Morada */}
            <form id="checkout-form" onSubmit={submit} noValidate className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6">
              {guest && (
                <div className="mb-6">
                  <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2">
                    <span>Já tens conta? Entra para usares a morada guardada e acompanhares a encomenda.</span>
                    <Link to="/login" state={{ from: '/checkout' }} className="font-semibold text-red-800 hover:underline">Entrar</Link>
                  </div>
                  <h2 className="font-bold mt-5">Comprar sem conta</h2>
                  <p className="text-xs text-zinc-500 mt-1">Enviamos a confirmação, a fatura e o link para acompanhares a encomenda para este email.</p>
                  <Field id="co-email" label="Email" type="email" autoComplete="email" value={guestEmail}
                    onChange={(e) => { setGuestEmail(e.target.value); if (errors.email) setErrors((er) => ({ ...er, email: undefined })); }}
                    error={errors.email} maxLength={120} className="mt-3" placeholder="o-teu@email.com" />
                </div>
              )}
              <h2 className="font-bold">Morada de entrega</h2>
              <p className="text-xs text-zinc-500 mt-1">Enviamos para Portugal (continente e ilhas).</p>

              <div className="mt-5 grid sm:grid-cols-2 gap-4">
                <Field id="co-name" label="Nome completo" autoComplete="name" value={address.name} onChange={set('name')} error={errors.name} maxLength={80} className="sm:col-span-2" />
                <Field id="co-phone" label="Telemóvel" type="tel" inputMode="tel" autoComplete="tel" placeholder="912 345 678" value={address.phone} onChange={set('phone')} error={errors.phone} hint="Para a transportadora te contactar" maxLength={20} className="sm:col-span-2" />
                <Field id="co-street" label="Morada" autoComplete="street-address" placeholder="Rua, número, andar" value={address.street} onChange={set('street')} error={errors.street} maxLength={150} className="sm:col-span-2" />
                <Field id="co-postalCode" label="Código postal" inputMode="numeric" autoComplete="postal-code" placeholder="1100-053" value={address.postalCode} onChange={set('postalCode')} error={errors.postalCode} />
                <Field id="co-city" label="Localidade" autoComplete="address-level2" placeholder="Lisboa" value={address.city} onChange={set('city')} error={errors.city} maxLength={60} />
                <div className="sm:col-span-2">
                  <p className="block text-sm font-semibold mb-1">País</p>
                  <p className="text-sm text-zinc-600 border border-zinc-200 bg-zinc-50 rounded-md px-3 py-2.5">Portugal</p>
                </div>
              </div>

              <h2 className="font-bold mt-8">Fatura e notas <span className="font-normal text-zinc-500 text-sm">(opcional)</span></h2>
              <div className="mt-4 grid gap-4">
                <Field id="co-nif" label="NIF" inputMode="numeric" placeholder="Só se quiseres fatura com contribuinte" value={nif}
                  onChange={(e) => { setNif(e.target.value.replace(/[^\d\s]/g, '').slice(0, 11)); setErrors((er) => ({ ...er, nif: undefined })); }}
                  error={errors.nif} />
                <div>
                  <label htmlFor="co-notes" className="block text-sm font-semibold mb-1">Notas para a entrega</label>
                  <textarea id="co-notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex.: tocar à campainha do 2.º esquerdo"
                    className="w-full border border-zinc-300 rounded-md px-3 py-2.5 text-base sm:text-sm outline-none focus:border-black" />
                </div>
              </div>
            </form>

            {/* Resumo */}
            <aside className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 lg:sticky lg:top-28">
              <h2 className="font-bold">A tua encomenda</h2>
              <ul className="mt-4 divide-y divide-zinc-100 max-h-72 overflow-y-auto">
                {items.map((i) => (
                  <li key={i.key} className="flex gap-3 py-3">
                    <span className="relative shrink-0">
                      <img src={imgUrl(i.image, 160)} alt="" className="w-14 h-16 object-cover rounded-md bg-zinc-100" />
                      <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-zinc-700 text-white text-[11px] font-bold flex items-center justify-center">{i.quantity}</span>
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold line-clamp-1">{i.name}</span>
                      <span className="block text-xs text-zinc-500">{[i.size && `Tamanho ${i.size}`, i.color?.name].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{formatEUR(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>

              {/* Código de desconto */}
              <div className="mt-4 border-t border-zinc-200 pt-4">
                {coupon && quote?.coupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm">
                    <span><strong className="font-mono">{quote.coupon.code}</strong> · {quote.coupon.label}</span>
                    <button type="button" onClick={() => { setCoupon(''); setCouponError(''); }} className="text-xs font-semibold text-red-800 hover:underline">Remover</button>
                  </div>
                ) : (
                  <form onSubmit={applyCoupon} className="flex gap-2">
                    <label htmlFor="co-coupon" className="sr-only">Código de desconto</label>
                    <input id="co-coupon" value={couponInput} onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      placeholder="Código de desconto" maxLength={20} autoComplete="off"
                      className="flex-1 min-w-0 border border-zinc-300 rounded-md px-3 py-2 text-base sm:text-sm uppercase outline-none focus:border-black" />
                    <button disabled={couponBusy || !couponInput.trim()} className="px-4 text-sm font-semibold border border-zinc-300 rounded-md hover:border-black disabled:opacity-50">
                      {couponBusy ? '...' : 'Aplicar'}
                    </button>
                  </form>
                )}
                {couponError && <p role="alert" className="text-xs text-red-700 mt-1.5">{couponError}</p>}
              </div>

              <dl className="mt-4 border-t border-zinc-200 pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-zinc-600">Subtotal</dt><dd className="tabular-nums">{formatEUR(quote?.subtotal ?? total)}</dd></div>
                {quote?.discount > 0 && (
                  <div className="flex justify-between text-green-700"><dt>Desconto ({quote.coupon?.code})</dt><dd className="tabular-nums">−{formatEUR(quote.discount)}</dd></div>
                )}
                <div className="flex justify-between">
                  <dt className="text-zinc-600">Envio{zone !== 'continente' && <span className="text-zinc-400"> ({ZONE_LABEL[zone]})</span>}</dt>
                  {(() => { const e = quote ? quote.shipping : envio; return (
                    <dd>{e === null ? '—' : e === 0 ? <span className="font-semibold text-green-700">Grátis</span> : <span className="tabular-nums">{formatEUR(e)}</span>}</dd>
                  ); })()}
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-bold">
                  <dt>Total</dt><dd className="text-red-800 tabular-nums">{formatEUR(quote ? quote.total : total + (envio || 0))}</dd>
                </div>
                <p className="text-[11px] text-zinc-500">IVA incluído.</p>
              </dl>

              {serverError && <p role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{serverError}</p>}
              {paymentsOff && (
                <p className="mt-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  {shipping.offline ? 'Sem ligação ao servidor. Confirma que o servidor está ligado.' : 'Os pagamentos ainda não estão ativos na loja.'}
                </p>
              )}

              <button type="submit" form="checkout-form" disabled={sending || paymentsOff || !shipping}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm font-semibold rounded-md">
                <FaLock className="text-xs" aria-hidden="true" />
                {sending ? 'A abrir o pagamento...' : 'Continuar para o pagamento'}
              </button>
              <p className="mt-3 text-xs text-zinc-500 text-center">
                Pagas na página segura do Stripe com <strong>MB WAY</strong>, <strong>Multibanco</strong>, cartão, Apple Pay ou Google Pay.
              </p>
              <p className="mt-3 text-[11px] text-zinc-500 text-center">
                Ao continuar, aceitas os <Link to="/termos" className="underline">Termos e Condições</Link> e a{' '}
                <Link to="/privacidade" className="underline">Política de Privacidade</Link>. Tens 14 dias para devolver.
              </p>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Checkout;
