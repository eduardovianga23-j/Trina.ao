import { useState } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

// Estrelas só para mostrar (ex.: 4.5 → ★★★★½)
export const Stars = ({ value = 0, size = 14, className = '' }) => (
  <span className={`inline-flex items-center gap-0.5 text-amber-500 ${className}`} role="img" aria-label={`${value} de 5 estrelas`}>
    {[1, 2, 3, 4, 5].map((n) => {
      const Icon = value >= n ? FaStar : value >= n - 0.5 ? FaStarHalfAlt : FaRegStar;
      return <Icon key={n} size={size} aria-hidden="true" />;
    })}
  </span>
);

const LABELS = ['', 'Muito mau', 'Mau', 'Razoável', 'Bom', 'Excelente'];

// Escolher de 1 a 5 estrelas
export const StarInput = ({ value, onChange, id }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-labelledby={id} className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="p-0.5 text-amber-500 transition-transform hover:scale-110"
          >
            {shown >= n ? <FaStar size={28} /> : <FaRegStar size={28} />}
          </button>
        ))}
      </div>
      <span className="text-sm text-zinc-600 min-w-[80px]">{LABELS[shown]}</span>
    </div>
  );
};

export default Stars;
