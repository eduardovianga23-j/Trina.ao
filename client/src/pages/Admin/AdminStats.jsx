import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import RevenueChart from './RevenueChart';
import ExportOrders from './ExportOrders';
import { useAuth } from '../../context/AuthContext';
import { reportAPI, apiError } from '../../services/api';
import { formatEUR, categoryLabel } from '../../utils/format';
import { PAYMENT_METHOD } from '../../utils/orders';
import { PERIODS, rangeFor, longDay } from '../../utils/periods';
import { imgUrl } from '../../utils/img';

/*
  /admin/estatisticas — vendas da loja (permissão "Estatísticas").
  Conta só encomendas pagas e não canceladas. Compara com o período anterior do mesmo tamanho.
*/
const card = 'bg-white rounded-xl border border-zinc-200 p-4 sm:p-5';

// Variação face ao período anterior: ▲ 12% / ▼ 5% (com seta e texto, nunca só cor)
const Delta = ({ now, before }) => {
  if (!before) return now > 0 ? <span className="text-xs text-zinc-500">sem vendas no período anterior</span> : null;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className="text-xs text-zinc-500">igual ao período anterior</span>;
  const up = pct > 0;
  return (
    <span className={`text-xs font-semibold ${up ? 'text-green-700' : 'text-red-700'}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span> {Math.abs(pct)}%{' '}
      <span className="font-normal text-zinc-500">vs. período anterior</span>
    </span>
  );
};

const Stat = ({ label, value, children }) => (
  <div className={card}>
    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</p>
    <p className="text-2xl sm:text-[28px] font-bold tabular-nums mt-1 leading-tight">{value}</p>
    <div className="mt-1 min-h-[18px]">{children}</div>
  </div>
);

// Lista com uma barra fina por linha (comprimento = valor)
const BarList = ({ rows, value, format, label, sub }) => {
  const max = Math.max(...rows.map(value), 0) || 1;
  return (
    <ul className="grid gap-3">
      {rows.map((r) => (
        <li key={label(r)}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{label(r)}{sub && <span className="text-zinc-500"> · {sub(r)}</span>}</span>
            <span className="font-semibold tabular-nums shrink-0">{format(value(r))}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-zinc-100">
            <div className="h-1.5 rounded-full bg-red-700" style={{ width: `${Math.max(2, (value(r) / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

const AdminStats = () => {
  const { can } = useAuth();
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const range = rangeFor(period);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    reportAPI.summary(range)
      .then(({ data: d }) => { if (alive) setData(d); })
      .catch((err) => { if (alive) setError(apiError(err)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [period]);

  const k = data?.kpis;
  const p = data?.previous;

  return (
    <AdminLayout title="Estatísticas" actions={can('orders') && <ExportOrders range={range} label="Exportar este período" />}>
      {/* Período (uma só linha, por cima de tudo) */}
      <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] -mx-1 px-1 pb-1 mb-2" role="group" aria-label="Período">
        {PERIODS.map((x) => (
          <button key={x.id} type="button" onClick={() => setPeriod(x.id)} aria-pressed={period === x.id}
            className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold border transition-colors ${period === x.id ? 'bg-black text-white border-black' : 'bg-white border-zinc-300 hover:border-black'}`}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-500 mb-5">
        {longDay(range.from)} até {longDay(range.to)} · só encomendas pagas
        {loading && data && ' · a atualizar...'}
      </p>

      {error && <p role="alert" className="mb-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
      {!data ? (
        !error && <p className="text-sm text-zinc-500">A carregar...</p>
      ) : (
        <div className={`grid grid-cols-1 gap-4 sm:gap-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {/* Para fazer agora */}
          {(data.pending.toShip > 0 || data.pending.awaiting > 0 || data.lowStockTotal > 0) && (
            <div className="flex flex-wrap gap-2">
              {data.pending.toShip > 0 && (
                <Link to="/admin/encomendas" className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2 hover:border-amber-400">
                  📦 <strong>{data.pending.toShip}</strong> {data.pending.toShip === 1 ? 'encomenda para enviar' : 'encomendas para enviar'}
                </Link>
              )}
              {data.pending.awaiting > 0 && (
                <Link to="/admin/encomendas" className="text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 hover:border-zinc-400">
                  ⏳ <strong>{data.pending.awaiting}</strong> à espera de pagamento Multibanco
                </Link>
              )}
              {data.lowStockTotal > 0 && (
                <a href="#stock" className="text-sm bg-red-50 border border-red-200 text-red-900 rounded-lg px-3 py-2 hover:border-red-400">
                  ⚠️ <strong>{data.lowStockTotal}</strong> {data.lowStockTotal === 1 ? 'tamanho com pouco stock' : 'tamanhos/cores com pouco stock'}
                </a>
              )}
            </div>
          )}

          {/* Números principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Stat label="Faturação" value={formatEUR(k.revenue)}><Delta now={k.revenue} before={p.revenue} /></Stat>
            <Stat label="Encomendas" value={k.orders}><Delta now={k.orders} before={p.orders} /></Stat>
            <Stat label="Valor médio" value={formatEUR(k.avgTicket)}><Delta now={k.avgTicket} before={p.avgTicket} /></Stat>
            <Stat label="Peças vendidas" value={k.items}>
              <span className="text-xs text-zinc-500">{k.customers} {k.customers === 1 ? 'cliente' : 'clientes'}</span>
            </Stat>
          </div>

          <div className={card}>
            <RevenueChart series={data.series} unit={data.unit} />
            <p className="text-xs text-zinc-500 mt-3">
              Inclui portes ({formatEUR(k.shipping)}) e já desconta os códigos de desconto ({formatEUR(k.discount)}). IVA incluído.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
            <section className={card}>
              <h2 className="font-bold mb-4">Mais vendidos</h2>
              {data.topProducts.length === 0 ? <p className="text-sm text-zinc-500">Ainda sem vendas neste período.</p> : (
                <ol className="grid gap-3">
                  {data.topProducts.map((t, i) => (
                    <li key={t.id} className="flex items-center gap-3">
                      <span className="w-5 text-sm font-bold text-zinc-400 tabular-nums">{i + 1}</span>
                      {t.image ? <img src={imgUrl(t.image, 120)} alt="" loading="lazy" className="w-10 h-12 object-cover rounded bg-zinc-100" /> : <span className="w-10 h-12 rounded bg-zinc-100" />}
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate">{t.name}</span>
                        <span className="block text-xs text-zinc-500">{formatEUR(t.revenue)}</span>
                      </span>
                      <span className="text-sm font-bold tabular-nums">{t.quantity} <span className="font-normal text-zinc-500">{t.quantity === 1 ? 'peça' : 'peças'}</span></span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className={card}>
              <h2 className="font-bold mb-4">Por categoria</h2>
              {data.categories.length === 0 ? <p className="text-sm text-zinc-500">Ainda sem vendas neste período.</p> : (
                <BarList rows={data.categories} value={(r) => r.revenue} format={formatEUR} label={(r) => categoryLabel(r.name)} sub={(r) => `${r.quantity} ${r.quantity === 1 ? 'peça' : 'peças'}`} />
              )}
            </section>

            <section className={card}>
              <h2 className="font-bold mb-4">Como pagaram</h2>
              {data.payments.length === 0 ? <p className="text-sm text-zinc-500">Ainda sem vendas neste período.</p> : (
                <BarList rows={data.payments} value={(r) => r.orders} format={(n) => `${n} ${n === 1 ? 'encomenda' : 'encomendas'}`}
                  label={(r) => PAYMENT_METHOD[r.method] || (r.method === 'outro' ? 'Outro' : r.method)} sub={(r) => formatEUR(r.revenue)} />
              )}
            </section>

            <section className={card}>
              <h2 className="font-bold mb-4">Para onde enviámos</h2>
              {data.zones.length === 0 ? <p className="text-sm text-zinc-500">Ainda sem vendas neste período.</p> : (
                <BarList rows={data.zones} value={(r) => r.orders} format={(n) => `${n} ${n === 1 ? 'encomenda' : 'encomendas'}`} label={(r) => r.label} sub={(r) => formatEUR(r.revenue)} />
              )}
            </section>
          </div>

          <section id="stock" className={`${card} scroll-mt-24`}>
            <h2 className="font-bold">Pouco stock</h2>
            <p className="text-xs text-zinc-500 mb-4">Tamanhos e cores com 2 peças ou menos (só produtos com controlo de stock).</p>
            {data.lowStock.length === 0 ? <p className="text-sm text-zinc-500">Está tudo com stock. 👍</p> : (
              <ul className="divide-y divide-zinc-100">
                {data.lowStock.map((s) => (
                  <li key={`${s.id}-${s.size}-${s.color}`} className="py-2 flex items-center gap-3 text-sm">
                    <span className="flex-1 min-w-0 truncate">
                      <strong className="font-semibold">{s.name}</strong>
                      {(s.size || s.color) && <span className="text-zinc-500"> · {[s.size, s.color].filter(Boolean).join(' · ')}</span>}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.stock === 0 ? 'bg-zinc-200 text-zinc-700' : 'bg-amber-100 text-amber-900'}`}>
                      {s.stock === 0 ? 'Esgotado' : `${s.stock} ${s.stock === 1 ? 'peça' : 'peças'}`}
                    </span>
                    {can('products') && <Link to={`/admin/editar/${s.id}`} className="text-xs font-semibold underline underline-offset-2 hover:text-red-800">Repor</Link>}
                  </li>
                ))}
              </ul>
            )}
            {data.lowStockTotal > data.lowStock.length && <p className="text-xs text-zinc-500 mt-2">E mais {data.lowStockTotal - data.lowStock.length}.</p>}
          </section>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminStats;
