import { useState } from 'react';

/*
  Foto da conta: usa a foto do Google quando existe; senão (ou se não carregar) mostra as iniciais.
  size em píxeis.
*/
const COLORS = ['#7f1d1d', '#1e3a8a', '#065f46', '#7c2d12', '#581c87', '#0f766e', '#9d174d'];
const initials = (name = '') => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
const colorFor = (text = '') => COLORS[[...text].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

const UserAvatar = ({ user, size = 32, className = '' }) => {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (user?.avatar && !broken) {
    return (
      <img
        src={user.avatar}
        alt=""
        style={style}
        referrerPolicy="no-referrer" // as fotos do Google recusam pedidos com referer de outros sites
        onError={() => setBroken(true)}
        className={`rounded-full object-cover bg-zinc-200 shrink-0 ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ ...style, backgroundColor: colorFor(user?.email || user?.name), fontSize: Math.round(size * 0.4) }}
      className={`rounded-full text-white font-bold flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {initials(user?.name)}
    </span>
  );
};

export default UserAvatar;
