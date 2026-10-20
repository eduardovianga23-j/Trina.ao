import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { FaEnvelope, FaPhoneAlt, FaClock, FaWhatsapp, FaCheckCircle, FaTruck, FaUndo } from 'react-icons/fa';
import Header from '../../assets/components/header/Header';
import TopHeader from '../../assets/components/topheader/TopHeader';
import Footer from '../../assets/components/footer/footer';
import { useAuth } from '../../context/AuthContext';
import { contactAPI, orderAPI, apiError } from '../../services/api';
import { LOJA } from '../../config/loja';
import { orderNumber, fmtDate } from '../../utils/orders';

/*
  /contactos — formulário (a mensagem chega ao email da loja) + contactos + "Sobre nós".
  ?assunto=devolucao abre já com esse assunto escolhido.
*/
const SUBJECTS = [
  ['encomenda', 'A minha encomenda'],
  ['devolucao', 'Trocas e devoluções'],
  ['produto', 'Dúvida sobre um produto'],
  ['pagamento', 'Pagamentos'],
  ['outro', 'Outro assunto'],
];

const input = 'w-full border border-zinc-300 rounded-md px-3 py-2.5 text-base sm:text-sm bg-white outline-none focus:border-black';
const isPlaceholder = (v) => !v || String(v).startsWith('[');

const Contactos = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const initialSubject = SUBJECTS.some(([k]) => k === params.get('assunto')) ? params.get('assunto') : 'encomenda';

  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', subject: initialSubject, order: '', message: '', website: '' });
  const [orders, setOrders] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = 'Contactos — Trina';
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 100);
    else window.scrollTo(0, 0);
    return () => { document.title = 'Trina.ao — Liberta a tua essência'; };
  }, [hash]);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email }));
    orderAPI.getMyOrders().then(({ data }) => setOrders(data.slice(0, 20))).catch(() => {});
  }, [user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Indica o teu nome.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Indica um email válido para te respondermos.');
    if (form.message.trim().length < 10) return setError('Escreve a tua mensagem (pelo menos 10 caracteres).');
    setSending(true);
    try {
      await contactAPI.send({ ...form, name: form.name.trim(), email: form.email.trim(), message: form.message.trim() });
      setSent(true);
    } catch (err) {
      setError(apiError(err, 'Não foi possível enviar. Tenta de novo.'));
    } finally {
      setSending(false);
    }
  };

  const showOrderField = ['encomenda', 'devolucao', 'pagamento'].includes(form.subject);

  return (
    <>
      <TopHeader />
      <Header />
      <main className="mt-[110px] bg-zinc-50">
        <div className="container-site py-8 sm:py-12">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Ajuda</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Fala connosco</h1>
          <p className="mt-2 text-zinc-600 max-w-2xl">Tens uma dúvida sobre uma encomenda, um tamanho ou uma devolução? Escreve-nos e respondemos o mais depressa possível, normalmente em 1 dia útil.</p>

          <div className="mt-8 grid lg:grid-cols-[1fr_340px] gap-6 lg:gap-10 items-start">
            {/* Formulário */}
            <section className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-7" aria-labelledby="form-title">
              {sent ? (
                <div className="text-center py-10" role="status">
                  <FaCheckCircle className="mx-auto text-4xl text-green-600" aria-hidden="true" />
                  <h2 className="text-lg font-bold mt-4">Mensagem enviada!</h2>
                  <p className="text-sm text-zinc-600 mt-1">Obrigado, {form.name.split(' ')[0]}. Vamos responder para <strong>{form.email}</strong>.</p>
                  <button type="button" onClick={() => { setSent(false); setForm((f) => ({ ...f, message: '', order: '' })); }}
                    className="mt-6 text-sm font-semibold text-red-800 hover:underline">Enviar outra mensagem</button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="grid gap-4">
                  <h2 id="form-title" className="font-bold text-lg">Envia-nos uma mensagem</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ct-name" className="block text-sm font-semibold mb-1">Nome</label>
                      <input id="ct-name" autoComplete="name" maxLength={80} value={form.name} onChange={set('name')} className={input} />
                    </div>
                    <div>
                      <label htmlFor="ct-email" className="block text-sm font-semibold mb-1">Email</label>
                      <input id="ct-email" type="email" autoComplete="email" maxLength={120} value={form.email} onChange={set('email')} className={input} />
                    </div>
                  </div>
                  <div className={`grid gap-4 ${showOrderField ? 'sm:grid-cols-2' : ''}`}>
                    <div>
                      <label htmlFor="ct-subject" className="block text-sm font-semibold mb-1">Assunto</label>
                      <select id="ct-subject" value={form.subject} onChange={set('subject')} className={input}>
                        {SUBJECTS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                      </select>
                    </div>
                    {showOrderField && (
                      <div>
                        <label htmlFor="ct-order" className="block text-sm font-semibold mb-1">Encomenda <span className="font-normal text-zinc-400">(opcional)</span></label>
                        {orders.length ? (
                          <select id="ct-order" value={form.order} onChange={set('order')} className={input}>
                            <option value="">Escolher...</option>
                            {orders.map((o) => (
                              <option key={o._id} value={`#${orderNumber(o._id)}`}>#{orderNumber(o._id)} · {fmtDate(o.createdAt)}</option>
                            ))}
                          </select>
                        ) : (
                          <input id="ct-order" value={form.order} onChange={set('order')} maxLength={20} placeholder="Ex.: #177931" className={input} />
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="ct-message" className="block text-sm font-semibold mb-1">Mensagem</label>
                    <textarea id="ct-message" rows={6} maxLength={3000} value={form.message} onChange={set('message')}
                      placeholder="Conta-nos como podemos ajudar..." className={input} />
                    <p className="text-xs text-zinc-400 text-right mt-1">{form.message.length}/3000</p>
                  </div>
                  {/* Campo escondido contra spam (as pessoas não o veem) */}
                  <input type="text" name="website" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                  {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
                  <div className="flex flex-wrap items-center gap-3">
                    <button disabled={sending} className="py-3 px-7 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm font-semibold rounded-md">
                      {sending ? 'A enviar...' : 'Enviar mensagem'}
                    </button>
                    <p className="text-xs text-zinc-500">Usamos os teus dados só para responder. <Link to="/privacidade" className="underline">Privacidade</Link></p>
                  </div>
                </form>
              )}
            </section>

            {/* Contactos */}
            <aside className="grid gap-4">
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <h2 className="font-bold">Outras formas de contacto</h2>
                <ul className="mt-3 grid gap-3 text-sm">
                  <li className="flex gap-3"><FaEnvelope className="text-red-800 mt-0.5 shrink-0" aria-hidden="true" />
                    <a href={`mailto:${LOJA.email}`} className="hover:underline break-all">{LOJA.email}</a></li>
                  {!isPlaceholder(LOJA.telefone) && (
                    <li className="flex gap-3"><FaPhoneAlt className="text-red-800 mt-0.5 shrink-0" aria-hidden="true" />
                      <a href={`tel:${LOJA.telefone.replace(/\s/g, '')}`} className="hover:underline">{LOJA.telefone}</a></li>
                  )}
                  {LOJA.whatsapp && (
                    <li className="flex gap-3"><FaWhatsapp className="text-green-600 mt-0.5 shrink-0" aria-hidden="true" />
                      <a href={`https://wa.me/${LOJA.whatsapp}`} target="_blank" rel="noreferrer" className="hover:underline">WhatsApp</a></li>
                  )}
                  <li className="flex gap-3"><FaClock className="text-red-800 mt-0.5 shrink-0" aria-hidden="true" /><span>{LOJA.horario}</span></li>
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <h2 className="font-bold">Respostas rápidas</h2>
                <ul className="mt-3 grid gap-2 text-sm">
                  <li><Link to="/envios-devolucoes#envios" className="flex items-center gap-2 hover:text-red-800"><FaTruck className="text-zinc-400" aria-hidden="true" /> Prazos e portes de envio</Link></li>
                  <li><Link to="/envios-devolucoes#devolucoes" className="flex items-center gap-2 hover:text-red-800"><FaUndo className="text-zinc-400" aria-hidden="true" /> Como devolver ou trocar</Link></li>
                  <li><Link to="/conta/encomendas" className="flex items-center gap-2 hover:text-red-800"><FaCheckCircle className="text-zinc-400" aria-hidden="true" /> Estado das minhas encomendas</Link></li>
                </ul>
              </div>
            </aside>
          </div>

          {/* Sobre nós */}
          <section id="sobre" className="mt-10 sm:mt-14 scroll-mt-32 bg-black text-white rounded-xl p-6 sm:p-10">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Sobre nós</p>
            <h2 className="text-xl sm:text-2xl font-bold mt-2">Liberta a tua essência</h2>
            <p className="mt-3 text-zinc-300 max-w-2xl leading-relaxed">{LOJA.sobre}</p>
            <Link to="/shop" className="inline-block mt-6 py-2.5 px-6 bg-white text-black text-sm font-semibold rounded-sm hover:bg-zinc-200">Ver a loja</Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Contactos;
