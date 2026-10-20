// Barra que mostra se a senha é fraca ou forte (as regras finais são confirmadas no servidor)
export const MIN_PASSWORD = 8;

export const passwordScore = (p = '') => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= MIN_PASSWORD) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (p.length < MIN_PASSWORD) s = Math.min(s, 1);
  return Math.min(4, s);
};

const LEVELS = [
  ['', 'bg-zinc-200'],
  ['Fraca', 'bg-red-600'],
  ['Razoável', 'bg-amber-500'],
  ['Boa', 'bg-lime-600'],
  ['Forte', 'bg-green-700'],
];

const PasswordStrength = ({ password }) => {
  if (!password) return <p className="text-xs text-zinc-500 -mt-2">Mínimo {MIN_PASSWORD} caracteres. Mistura letras, números e símbolos.</p>;
  const score = passwordScore(password);
  const [label, color] = LEVELS[score];
  return (
    <div className="-mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= score ? color : 'bg-zinc-200'}`} />)}
      </div>
      <p className="text-xs text-zinc-600 mt-1">
        {password.length < MIN_PASSWORD ? `Faltam ${MIN_PASSWORD - password.length} caracteres` : `Senha ${label.toLowerCase()}`}
      </p>
    </div>
  );
};

export default PasswordStrength;
