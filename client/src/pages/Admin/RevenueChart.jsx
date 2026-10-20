import { useEffect, useRef, useState } from 'react';
import { formatEUR } from '../../utils/format';
import { shortDay, shortMonth, longDay, longMonth } from '../../utils/periods';

/*
  Gráfico de colunas da faturação por dia (ou por mês).
  Uma só série: colunas finas (até 24px) com o topo arredondado, grelha discreta,
  dica ao passar o rato / tocar / com o teclado, e uma tabela com os mesmos números.
*/
const BAR = '#b91c1c';
const BAR_HOVER = '#7f1d1d';
const GRID = '#e4e4e7';
const MUTED = '#71717a';

const compact = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} mil €` : `${Math.round(n)} €`);

// Máximo "redondo" do eixo e 4 divisões
const niceMax = (v) => {
  if (v <= 0) return 100;
  const step = 10 ** Math.floor(Math.log10(v / 4));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step * 4 >= v) return m * step * 4;
  return v;
};

// Coluna com os cantos de cima arredondados (4px) e a base direita
const column = (x, y, w, h) => {
  if (h <= 0) return '';
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
};

const RevenueChart = ({ series, unit }) => {
  const wrap = useRef(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState(null);
  const [table, setTable] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [table]);

  const label = unit === 'month' ? shortMonth : shortDay;
  const long = unit === 'month' ? longMonth : longDay;
  const height = 240;
  const pad = { top: 12, right: 8, bottom: 28, left: 64 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(...series.map((s) => s.revenue), 0));
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  const slot = plotW / Math.max(series.length, 1);
  const barW = Math.max(2, Math.min(24, slot * 0.68));
  const every = Math.max(1, Math.ceil(series.length / Math.max(2, Math.floor(plotW / 64))));
  const y = (v) => pad.top + plotH - (v / max) * plotH;
  const empty = series.every((s) => s.revenue === 0);
  const a = active != null ? series[active] : null;

  return (
    <figure className="m-0">
      <div className="flex items-center justify-between gap-3 mb-3">
        <figcaption className="font-bold">Faturação por {unit === 'month' ? 'mês' : 'dia'}</figcaption>
        <button type="button" onClick={() => setTable((t) => !t)} className="text-xs font-semibold text-zinc-600 hover:text-black underline underline-offset-2">
          {table ? 'Ver gráfico' : 'Ver tabela'}
        </button>
      </div>

      {table ? (
        <div className="max-h-[300px] overflow-y-auto border border-zinc-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 sticky top-0">
              <tr><th className="text-left font-semibold px-3 py-2">{unit === 'month' ? 'Mês' : 'Dia'}</th><th className="text-right font-semibold px-3 py-2">Encomendas</th><th className="text-right font-semibold px-3 py-2">Faturação</th></tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.key} className="border-t border-zinc-100">
                  <td className="px-3 py-1.5">{long(s.key)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{s.orders}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatEUR(s.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrap} className="relative w-full min-w-0" onMouseLeave={() => setActive(null)}>
          <svg width={width} height={height} role="img" aria-label={`Faturação por ${unit === 'month' ? 'mês' : 'dia'}. Usa "Ver tabela" para ver os números.`} className="block select-none">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" shapeRendering="crispEdges" />
                <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill={MUTED} className="tabular-nums">{compact(t)}</text>
              </g>
            ))}
            {series.map((s, i) => {
              const cx = pad.left + slot * i + slot / 2;
              const top = y(s.revenue);
              return (
                <g key={s.key}>
                  <path d={column(cx - barW / 2, top, barW, pad.top + plotH - top)} fill={active === i ? BAR_HOVER : BAR} />
                  {i % every === 0 && (
                    <text x={cx} y={height - 8} textAnchor="middle" fontSize="11" fill={MUTED}>{label(s.key)}</text>
                  )}
                  {/* Área de toque maior que a coluna (a coluna inteira do dia) */}
                  <rect x={pad.left + slot * i} y={pad.top} width={slot} height={plotH} fill="transparent" tabIndex={0}
                    aria-label={`${long(s.key)}: ${formatEUR(s.revenue)}, ${s.orders} ${s.orders === 1 ? 'encomenda' : 'encomendas'}`}
                    onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
                    onTouchStart={() => setActive(i)} className="outline-none focus-visible:stroke-zinc-900" />
                </g>
              );
            })}
          </svg>
          {empty && <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500 pointer-events-none">Sem vendas neste período</p>}
          {a && (
            <div role="status" className="absolute pointer-events-none bg-white border border-zinc-200 shadow-md rounded-lg px-3 py-2 text-xs whitespace-nowrap"
              style={{
                left: Math.min(Math.max(pad.left + slot * active + slot / 2, 80), width - 80),
                top: Math.max(0, y(a.revenue) - 62),
                transform: 'translateX(-50%)',
              }}>
              <p className="text-zinc-500">{long(a.key)}</p>
              <p><strong className="text-sm tabular-nums">{formatEUR(a.revenue)}</strong> · {a.orders} {a.orders === 1 ? 'encomenda' : 'encomendas'}</p>
            </div>
          )}
        </div>
      )}
    </figure>
  );
};

export default RevenueChart;
