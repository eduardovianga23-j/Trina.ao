// Períodos para as estatísticas e a exportação (datas "2026-10-20", no dia de Portugal)
const key = (d) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Lisbon' });
const today = () => new Date(`${key(new Date())}T12:00:00`);
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

export const PERIODS = [
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: 'mes-passado', label: 'Mês passado' },
  { id: 'ano', label: 'Este ano' },
  { id: '12m', label: '12 meses' },
];

export const rangeFor = (id) => {
  const t = today();
  const y = t.getFullYear();
  const m = t.getMonth();
  switch (id) {
    case '7d': return { from: key(addDays(t, -6)), to: key(t) };
    case 'mes': return { from: key(new Date(y, m, 1, 12)), to: key(t) };
    case 'mes-passado': return { from: key(new Date(y, m - 1, 1, 12)), to: key(new Date(y, m, 0, 12)) };
    case 'ano': return { from: key(new Date(y, 0, 1, 12)), to: key(t) };
    case '12m': return { from: key(new Date(y, m - 11, 1, 12)), to: key(t) };
    case '30d':
    default: return { from: key(addDays(t, -29)), to: key(t) };
  }
};

export const periodLabel = (id) => PERIODS.find((p) => p.id === id)?.label || '';

// "2026-10-20" → "20 out." · "2026-10" → "out. 2026"
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const shortDay = (k) => `${Number(k.slice(8, 10))} ${MONTHS[Number(k.slice(5, 7)) - 1]}`;
export const shortMonth = (k) => `${MONTHS[Number(k.slice(5, 7)) - 1]} ${k.slice(2, 4)}`;
export const longDay = (k) => new Date(`${k}T12:00:00`).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
export const longMonth = (k) => new Date(`${k}-15T12:00:00`).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
