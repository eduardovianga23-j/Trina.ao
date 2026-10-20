import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, useLocation, useParams } from 'react-router-dom';
import { FaBoxOpen, FaHeart, FaUserCog, FaThLarge, FaGoogle, FaChevronRight } from 'react-icons/fa';
import Header from '../../assets/components/header/Header';
import TopHeader from '../../assets/components/topheader/TopHeader';
import Footer from '../../assets/components/footer/footer';
import UserAvatar from '../../assets/components/ui/UserAvatar';
import FavoritesList from './FavoritesList';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { authAPI, orderAPI, userAPI, apiError } from '../../services/api';
import { formatEUR } from '../../utils/format';
import PasswordStrength, { MIN_PASSWORD } from '../../assets/components/ui/PasswordStrength';
import { PAYMENT_STATUS, fmtDate, orderNumber, statusBadge } from '../../utils/orders';

/*
  Minha conta:  /conta  ·  /conta/encomendas  ·  /conta/favoritos  ·  /conta/dados
*/
const TABS = [
  ['', 'Resumo', FaThLarge],
  ['encomendas', 'Encomendas', FaBoxOpen],
  ['favoritos', 'Favoritos', FaHeart],
  ['dados', 'Dados da conta', FaUserCog],
];


// ---------- Encomendas ----------
const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    orderAPI.getMyOrders()
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);
  return { orders, loading, error };
};

const NoOrders = () => (
  <div className="text-center py-12 px-4 bg-white rounded-xl border border-zinc-200">
    <FaBoxOpen className="mx-auto text-4xl text-zinc-300" aria-hidden="true" />
    <p className="font-semibold mt-4">Ainda não fizeste nenhuma compra</p>
    <p className="text-sm text-zinc-500 mt-1">Quando fizeres uma encomenda, vais poder acompanhá-la aqui.</p>
    <Link to="/shop" className="inline-block mt-6 py-2.5 px-6 bg-black hover:bg-zinc-800 text-white text-sm font-semibold rounded-sm">Começar a comprar</Link>
  </div>
);

const OrderCard = ({ order }) => {
  const [label, cls] = order.paymentStatus === 'failed' ? ['Não paga', 'bg-zinc-200 text-zinc-700'] : statusBadge(order);
  const qty = order.items.reduce((a, i) => a + i.quantity, 0);
  return (
    <li><Link to={`/encomenda/${order._id}`} className="block bg-white rounded-xl border border-zinc-200 p-4 hover:border-zinc-400 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">Encomenda #{orderNumber(order._id)}</p>
          <p className="text-xs text-zinc-500">{fmtDate(order.createdAt)} · {qty} {qty === 1 ? 'artigo' : 'artigos'}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${cls}`}>{label}</span>
      </div>
      <ul className="mt-3 flex gap-2 overflow-x-auto">
        {order.items.map((it, i) => (
          <li key={i} className="shrink-0" title={`${it.name} × ${it.quantity}`}>
            <img src={it.image} alt={it.name} className="w-14 h-16 object-cover rounded-md bg-zinc-100" />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-sm">
        <span className="text-zinc-500">{PAYMENT_STATUS[order.paymentStatus] || ''}</span>
        <span className="font-bold">Total: {formatEUR(order.total)}</span>
      </div>
    </Link></li>
  );
};

const OrdersTab = () => {
  const { orders, loading, error } = useOrders();
  if (loading) return <p className="text-sm text-zinc-500">A carregar as encomendas...</p>;
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!orders.length) return <NoOrders />;
  return <ul className="grid gap-3">{orders.map((o) => <OrderCard key={o._id} order={o} />)}</ul>;
};

// ---------- Resumo ----------
const SummaryTab = () => {
  const { orders, loading } = useOrders();
  const { count } = useFavorites();
  const card = 'bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4 hover:border-zinc-400 transition-colors';
  return (
    <div className="grid gap-6">
      <div className="grid sm:grid-cols-2 gap-3">
        <Link to="/conta/encomendas" className={card}>
          <span className="w-11 h-11 rounded-full bg-red-50 text-red-800 flex items-center justify-center"><FaBoxOpen /></span>
          <span className="flex-1">
            <span className="block text-sm font-bold">Encomendas</span>
            <span className="block text-xs text-zinc-500">
              {loading ? 'A carregar...' : orders.length ? `${orders.length} ${orders.length === 1 ? 'encomenda' : 'encomendas'}` : 'Ainda não fizeste compras'}
            </span>
          </span>
          <FaChevronRight className="text-zinc-400 text-xs" />
        </Link>
        <Link to="/conta/favoritos" className={card}>
          <span className="w-11 h-11 rounded-full bg-red-50 text-red-800 flex items-center justify-center"><FaHeart /></span>
          <span className="flex-1">
            <span className="block text-sm font-bold">Favoritos</span>
            <span className="block text-xs text-zinc-500">{count ? `${count} ${count === 1 ? 'produto' : 'produtos'}` : 'Nenhum favorito ainda'}</span>
          </span>
          <FaChevronRight className="text-zinc-400 text-xs" />
        </Link>
      </div>

      <section>
        <h2 className="font-bold mb-3">Última encomenda</h2>
        {loading ? <p className="text-sm text-zinc-500">A carregar...</p> : orders.length ? <ul><OrderCard order={orders[0]} /></ul> : <NoOrders />}
      </section>

      {count > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Os teus favoritos</h2>
            <Link to="/conta/favoritos" className="text-sm font-semibold text-red-800 hover:underline">Ver todos</Link>
          </div>
          <FavoritesList limit={4} />
        </section>
      )}
    </div>
  );
};

// ---------- Senha ----------
const PasswordForm = ({ hasPassword, onDone }) => {
  const { startSession } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const field = 'w-full border border-zinc-300 rounded-md px-3 py-2.5 text-base sm:text-sm outline-none focus:border-black';

  const save = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.next.length < MIN_PASSWORD) return setMsg(['err', `A senha nova tem de ter pelo menos ${MIN_PASSWORD} caracteres.`]);
    if (form.next !== form.confirm) return setMsg(['err', 'As duas senhas novas não são iguais.']);
    setSaving(true);
    try {
      const { data } = await authAPI.changePassword(form.current, form.next);
      startSession(data);
      setForm({ current: '', next: '', confirm: '' });
      setMsg(['ok', hasPassword ? 'Senha alterada. As sessões noutros dispositivos foram terminadas.' : 'Senha criada. Agora também podes entrar com email e senha.']);
      onDone?.();
    } catch (err) {
      setMsg(['err', apiError(err)]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 grid gap-3" noValidate>
      <h2 className="font-bold">{hasPassword ? 'Mudar a senha' : 'Criar uma senha'}</h2>
      {!hasPassword && <p className="text-xs text-zinc-500 -mt-2">Entras com o Google. Se quiseres, cria também uma senha para entrar com o email.</p>}
      {hasPassword && (
        <div>
          <label htmlFor="pw-cur" className="text-sm font-semibold">Senha atual</label>
          <input id="pw-cur" type="password" autoComplete="current-password" value={form.current} onChange={set('current')} className={`mt-1 ${field}`} />
          <Link to="/recuperar-senha" className="text-xs text-red-800 hover:underline">Não sabes a senha atual?</Link>
        </div>
      )}
      <div>
        <label htmlFor="pw-new" className="text-sm font-semibold">Senha nova</label>
        <input id="pw-new" type="password" autoComplete="new-password" value={form.next} onChange={set('next')} className={`mt-1 mb-3 ${field}`} />
        <PasswordStrength password={form.next} />
      </div>
      <div>
        <label htmlFor="pw-conf" className="text-sm font-semibold">Repetir a senha nova</label>
        <input id="pw-conf" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} className={`mt-1 ${field}`} />
      </div>
      {msg && <p role="status" className={`text-sm ${msg[0] === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{msg[1]}</p>}
      <button disabled={saving || !form.next || !form.confirm || (hasPassword && !form.current)}
        className="justify-self-start py-2.5 px-5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-semibold rounded-md">
        {saving ? 'A guardar...' : hasPassword ? 'Mudar a senha' : 'Criar senha'}
      </button>
    </form>
  );
};

// ---------- Dados ----------
const DataTab = () => {
  const { user, updateUser, logout } = useAuth();
  const [me, setMe] = useState(null);
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadMe = () => authAPI.getMe().then(({ data }) => setMe(data)).catch(() => {});
  useEffect(() => { loadMe(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const { data } = await userAPI.updateProfile({ name: name.trim() });
      updateUser({ name: data.name });
      setMsg(['ok', 'Nome atualizado.']);
    } catch (err) {
      setMsg(['err', apiError(err)]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 max-w-xl">
      <form onSubmit={save} className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 grid gap-3">
        <h2 className="font-bold">Os teus dados</h2>
        <label htmlFor="acc-name" className="text-sm font-semibold">Nome</label>
        <input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
          className="w-full border border-zinc-300 rounded-md px-3 py-2.5 text-base sm:text-sm outline-none focus:border-black" />
        <p className="text-sm font-semibold mt-1">Email</p>
        <p className="text-sm text-zinc-600 -mt-2">{user.email}</p>
        {msg && <p role="status" className={`text-sm ${msg[0] === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{msg[1]}</p>}
        <button disabled={saving || name.trim() === user.name || name.trim().length < 2}
          className="justify-self-start py-2.5 px-5 bg-black hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-semibold rounded-md">
          {saving ? 'A guardar...' : 'Guardar'}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6">
        <h2 className="font-bold">Como entras</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          <li className="flex items-center gap-2">
            <FaGoogle className={me?.google ? 'text-[#4285F4]' : 'text-zinc-300'} aria-hidden="true" />
            {me?.google ? 'Conta ligada ao Google' : 'Ainda não entraste com o Google'}
          </li>
        </ul>
        <p className="text-xs text-zinc-500 mt-3">
          Para apagar a conta ou pedir os teus dados, escreve-nos (ver a <Link to="/privacidade#direitos" className="underline">Política de Privacidade</Link>).
        </p>
      </div>

      {me && <PasswordForm hasPassword={me.hasPassword} onDone={loadMe} />}

      <button onClick={logout} className="justify-self-start text-sm font-semibold text-red-800 hover:underline">Terminar sessão</button>
    </div>
  );
};

// ---------- Página ----------
const Account = () => {
  const { tab = '' } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const current = TABS.find(([t]) => t === tab);

  useEffect(() => {
    if (current) document.title = `${current[1]} — A minha conta — Trina`;
    return () => { document.title = 'Trina.ao — Liberta a tua essência'; };
  }, [tab]);

  if (!current) return <Navigate to="/conta" replace />;

  return (
    <>
      <TopHeader />
      <Header />
      <main className="mt-[110px] bg-zinc-50 min-h-[70vh]">
        <div className="container-site py-6 sm:py-10">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size={56} />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-zinc-500">A minha conta</p>
              <h1 className="text-xl sm:text-2xl font-bold truncate">Olá, {user.name.split(' ')[0]}</h1>
            </div>
          </div>

          {state?.notice && <p role="status" className="mt-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">{state.notice}</p>}

          <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-zinc-200 -mx-[4%] px-[4%] sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Secções da conta">
            {TABS.map(([t, label, Icon]) => (
              <NavLink key={t} to={t ? `/conta/${t}` : '/conta'} end
                className={({ isActive }) => `shrink-0 flex items-center gap-2 px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px ${
                  isActive ? 'border-red-800 text-black' : 'border-transparent text-zinc-500 hover:text-black'}`}>
                <Icon className="text-xs" aria-hidden="true" /> {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6">
            {tab === '' && <SummaryTab />}
            {tab === 'encomendas' && <OrdersTab />}
            {tab === 'favoritos' && <FavoritesList />}
            {tab === 'dados' && <DataTab />}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Account;
