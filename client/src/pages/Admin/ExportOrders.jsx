import { useEffect, useRef, useState } from 'react';
import { reportAPI, apiError } from '../../services/api';
import { PERIODS, rangeFor } from '../../utils/periods';

/*
  Botão "Exportar para Excel": descarrega as encomendas de um período num ficheiro .csv
  (abre diretamente no Excel, com acentos, colunas separadas e valores em euros).
  Se receber `range` ({ from, to }), usa esse período; senão mostra a escolha do período.
*/
const download = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const ExportOrders = ({ range: fixedRange, label = 'Exportar para Excel' }) => {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState('mes');
  const [view, setView] = useState('pagas');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const run = async (range, v) => {
    setBusy(true);
    setError('');
    try {
      const { data } = await reportAPI.ordersCsv({ ...range, view: v });
      download(data, `encomendas-${range.from}-a-${range.to}.csv`);
      setOpen(false);
    } catch (err) {
      // A resposta de erro também vem como ficheiro: lê a mensagem
      let msg = apiError(err, 'Não foi possível exportar.');
      try { msg = JSON.parse(await err.response.data.text()).message || msg; } catch { /* fica a mensagem geral */ }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const btn = 'inline-flex items-center gap-2 py-2.5 px-4 text-sm font-semibold border border-zinc-300 bg-white rounded-md hover:border-black disabled:opacity-60';
  const icon = (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3v10m0 0-4-4m4 4 4-4M4 15v2h12v-2" />
    </svg>
  );

  if (fixedRange) {
    return (
      <span className="inline-flex flex-col items-end">
        <button type="button" onClick={() => run(fixedRange, 'pagas')} disabled={busy} className={btn}>{icon}{busy ? 'A preparar...' : label}</button>
        {error && <span role="alert" className="text-xs text-red-800 mt-1">{error}</span>}
      </span>
    );
  }

  return (
    <div className="relative" ref={box}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={btn}>{icon}{label}</button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-[min(20rem,calc(100vw-2rem))] bg-white border border-zinc-200 rounded-xl shadow-lg p-4 grid gap-3">
          <div>
            <label htmlFor="exp-period" className="block text-sm font-semibold mb-1">Período</label>
            <select id="exp-period" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm bg-white">
              {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold mb-1">Encomendas</legend>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="exp-view" checked={view === 'pagas'} onChange={() => setView('pagas')} className="accent-red-800" /> Só as pagas</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="exp-view" checked={view === 'todas'} onChange={() => setView('todas')} className="accent-red-800" /> Todas (incluindo por pagar)</label>
          </fieldset>
          {error && <p role="alert" className="text-xs text-red-800 bg-red-50 border border-red-200 rounded px-2 py-1.5">{error}</p>}
          <button type="button" onClick={() => run(rangeFor(period), view)} disabled={busy}
            className="py-2.5 px-4 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm font-semibold rounded-md">
            {busy ? 'A preparar...' : 'Descarregar ficheiro'}
          </button>
          <p className="text-[11px] text-zinc-500">Ficheiro .csv: abre com duplo clique no Excel.</p>
        </div>
      )}
    </div>
  );
};

export default ExportOrders;
