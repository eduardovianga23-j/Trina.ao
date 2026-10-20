import { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

// Janela com a tabela de tamanhos (fecha com Esc, clique fora ou no X)
const SizeGuide = ({ guide, highlight, onClose }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = o; };
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="sg-title" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="sg-title" className="font-bold text-lg">{guide.title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="w-9 h-9 -mt-1 -mr-1 flex items-center justify-center rounded-full hover:bg-zinc-100"><FaTimes /></button>
        </div>
        <p className="text-sm text-zinc-600 mt-1">{guide.intro}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              <tr className="bg-zinc-100">{guide.columns.map((c) => <th key={c} scope="col" className="px-2 py-2 font-semibold">{c}</th>)}</tr>
            </thead>
            <tbody>
              {guide.rows.map((r) => (
                <tr key={r[0]} className={`border-b border-zinc-100 ${r[0] === highlight ? 'bg-red-50 font-semibold' : ''}`}>
                  {r.map((v, i) => i === 0 ? <th key={i} scope="row" className="px-2 py-2">{v}</th> : <td key={i} className="px-2 py-2 tabular-nums">{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-4 grid gap-2 text-sm">
          {guide.howTo.map(([t, d]) => (
            <div key={t}><dt className="font-semibold">{t}</dt><dd className="text-zinc-600">{d}</dd></div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default SizeGuide;
