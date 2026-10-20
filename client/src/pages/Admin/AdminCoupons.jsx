import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { couponAPI, apiError } from '../../services/api';
import { formatEUR } from '../../utils/format';
import { fmtDate } from '../../utils/orders';

/*
  /admin/descontos — códigos de desconto (permissão "Produtos").
  Tipos: % nos produtos, valor fixo em euros, ou envio grátis.
*/
const EMPTY = {
  code: '', description: '', type: 'percent', value: '10', minSubtotal: '', startsAt: '', expiresAt: '',
  maxUses: '', onePerCustomer: true, firstOrderOnly: false, active: true,
};
const TYPE_LABEL = { percent: '% de desconto', fixed: 'Euros de desconto', shipping: 'Envio grátis' };
const input = 'w-full border border-zinc-300 rounded-md px-3 py-2.5 text-base sm:text-sm bg-white outline-none focus:border-black';
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const describe = (c) =>
  c.type === 'percent' ? `${c.value}% nos produtos` : c.type === 'fixed' ? `${formatEUR(c.value)} de desconto` : 'Envio grátis';

const status = (c) => {
  const now = new Date();
  if (!c.active) return ['Desligado', 'bg-zinc-200 text-zinc-700'];
  if (c.startsAt && now < new Date(c.startsAt)) return ['Agendado', 'bg-blue-100 text-blue-800'];
  if (c.expiresAt && now > new Date(c.expiresAt)) return ['Expirado', 'bg-zinc-200 text-zinc-700'];
  if (c.maxUses && c.usedCount >= c.maxUses) return ['Esgotado', 'bg-zinc-200 text-zinc-700'];
  return ['Ativo', 'bg-green-100 text-green-800'];
};

const CouponForm = ({ initial, onSaved, onCancel }) => {
  const editing = Boolean(initial?._id);
  const [form, setForm] = useState(() => (initial ? {
    ...EMPTY, ...initial,
    value: String(initial.value ?? ''), minSubtotal: initial.minSubtotal ? String(initial.minSubtotal) : '',
    maxUses: initial.maxUses ? String(initial.maxUses) : '', startsAt: toDateInput(initial.startsAt), expiresAt: toDateInput(initial.expiresAt),
  } : EMPTY));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      value: form.type === 'shipping' ? 0 : form.value,
      startsAt: form.startsAt || '',
      // termina no fim do dia escolhido
      expiresAt: form.expiresAt ? `${form.expiresAt}T23:59:59` : '',
    };
    try {
      const { data } = editing ? await couponAPI.update(initial._id, payload) : await couponAPI.create(payload);
      onSaved(data, editing);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-6 grid gap-4">
      <h2 className="font-bold">{editing ? `Editar ${initial.code}` : 'Novo código de desconto'}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cp-code" className="block text-sm font-semibold mb-1">Código</label>
          <input id="cp-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))}
            maxLength={20} placeholder="BEMVINDA10" disabled={editing} className={`${input} font-mono uppercase disabled:bg-zinc-50`} />
          {editing && <p className="text-xs text-zinc-500 mt-1">O código não se muda depois de criado.</p>}
        </div>
        <div>
          <label htmlFor="cp-desc" className="block text-sm font-semibold mb-1">Descrição <span className="font-normal text-zinc-400">(só para ti)</span></label>
          <input id="cp-desc" value={form.description} onChange={set('description')} maxLength={120} placeholder="Primeira compra no Instagram" className={input} />
        </div>
        <div>
          <label htmlFor="cp-type" className="block text-sm font-semibold mb-1">Tipo</label>
          <select id="cp-type" value={form.type} onChange={set('type')} className={input}>
            {Object.entries(TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        {form.type !== 'shipping' && (
          <div>
            <label htmlFor="cp-value" className="block text-sm font-semibold mb-1">{form.type === 'percent' ? 'Percentagem (%)' : 'Valor (€)'}</label>
            <input id="cp-value" inputMode="decimal" value={form.value} onChange={set('value')} placeholder={form.type === 'percent' ? '10' : '5'} className={input} />
          </div>
        )}
        <div>
          <label htmlFor="cp-min" className="block text-sm font-semibold mb-1">Compra mínima (€) <span className="font-normal text-zinc-400">(opcional)</span></label>
          <input id="cp-min" inputMode="decimal" value={form.minSubtotal} onChange={set('minSubtotal')} placeholder="0" className={input} />
        </div>
        <div>
          <label htmlFor="cp-max" className="block text-sm font-semibold mb-1">Limite de utilizações <span className="font-normal text-zinc-400">(opcional)</span></label>
          <input id="cp-max" inputMode="numeric" value={form.maxUses} onChange={set('maxUses')} placeholder="Sem limite" className={input} />
        </div>
        <div>
          <label htmlFor="cp-start" className="block text-sm font-semibold mb-1">Começa <span className="font-normal text-zinc-400">(opcional)</span></label>
          <input id="cp-start" type="date" value={form.startsAt} onChange={set('startsAt')} className={input} />
        </div>
        <div>
          <label htmlFor="cp-end" className="block text-sm font-semibold mb-1">Termina <span className="font-normal text-zinc-400">(opcional)</span></label>
          <input id="cp-end" type="date" value={form.expiresAt} onChange={set('expiresAt')} className={input} />
        </div>
      </div>
      <div className="grid gap-2 text-sm">
        <label className="flex items-center gap-2.5"><input type="checkbox" checked={form.onePerCustomer} onChange={set('onePerCustomer')} className="w-4 h-4 accent-red-800" /> Cada cliente só pode usar uma vez</label>
        <label className="flex items-center gap-2.5"><input type="checkbox" checked={form.firstOrderOnly} onChange={set('firstOrderOnly')} className="w-4 h-4 accent-red-800" /> Só na primeira compra</label>
        <label className="flex items-center gap-2.5"><input type="checkbox" checked={form.active} onChange={set('active')} className="w-4 h-4 accent-red-800" /> Ativo</label>
      </div>
      {error && <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
      <div className="flex gap-2">
        <button disabled={saving || form.code.length < 3} className="py-2.5 px-5 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm font-semibold rounded-md">
          {saving ? 'A guardar...' : editing ? 'Guardar' : 'Criar código'}
        </button>
        <button type="button" onClick={onCancel} className="py-2.5 px-5 border border-zinc-300 text-sm font-semibold rounded-md">Cancelar</button>
      </div>
    </form>
  );
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null = fechado · {} = novo · cupão = editar
  const [notice, setNotice] = useState('');

  useEffect(() => { couponAPI.list().then(({ data }) => setCoupons(data)).catch((err) => setError(apiError(err))); }, []);

  const saved = (c, wasEditing) => {
    setCoupons((list) => (wasEditing ? list.map((x) => (x._id === c._id ? { ...x, ...c } : x)) : [{ ...c, totalDiscount: 0 }, ...list]));
    setEditing(null);
    setNotice(wasEditing ? `Código ${c.code} atualizado.` : `Código ${c.code} criado. Partilha-o com os teus clientes!`);
  };
  const remove = async (c) => {
    if (!window.confirm(`Apagar o código ${c.code}? As encomendas que já o usaram não mudam.`)) return;
    try {
      await couponAPI.remove(c._id);
      setCoupons((list) => list.filter((x) => x._id !== c._id));
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <AdminLayout title="Códigos de desconto"
      actions={!editing && <button onClick={() => { setEditing({}); setNotice(''); }} className="py-2.5 px-5 bg-red-800 hover:bg-red-900 text-white text-sm font-semibold rounded-md">+ Novo código</button>}>
      {notice && <p role="status" className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">{notice}</p>}
      {error && <p role="alert" className="mb-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
      {editing && <div className="mb-6"><CouponForm initial={editing._id ? editing : null} onSaved={saved} onCancel={() => setEditing(null)} /></div>}

      {!coupons ? (
        <p className="text-sm text-zinc-500">A carregar...</p>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center">
          <p className="font-semibold">Ainda não tens códigos de desconto.</p>
          <p className="text-sm text-zinc-500 mt-1">Ideia: cria <strong className="font-mono">BEMVINDA10</strong> com 10% só na primeira compra.</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {coupons.map((c) => {
            const [label, cls] = status(c);
            return (
              <li key={c._id} className="bg-white rounded-xl border border-zinc-200 p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">{c.code}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${cls}`}>{label}</span>
                  </p>
                  <p className="text-sm text-zinc-700">{describe(c)}{c.minSubtotal ? ` · a partir de ${formatEUR(c.minSubtotal)}` : ''}{c.firstOrderOnly ? ' · só 1.ª compra' : ''}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Usado {c.usedCount}{c.maxUses ? ` de ${c.maxUses}` : ''} {c.usedCount === 1 ? 'vez' : 'vezes'}
                    {c.totalDiscount > 0 && ` · ${formatEUR(c.totalDiscount)} descontados`}
                    {c.expiresAt && ` · termina a ${fmtDate(c.expiresAt)}`}
                    {c.description && ` · ${c.description}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(c); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="py-2 px-4 text-xs sm:text-sm font-semibold border border-zinc-300 rounded-md hover:border-black">Editar</button>
                  <button onClick={() => remove(c)} className="py-2 px-4 text-xs sm:text-sm font-semibold text-red-800 border border-red-200 rounded-md hover:bg-red-50">Apagar</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminLayout>
  );
};

export default AdminCoupons;
