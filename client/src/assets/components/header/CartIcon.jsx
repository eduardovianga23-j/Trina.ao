import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../../../context/CartContext';

/*
  Ícone do carrinho com contador.
  - A bolinha só aparece quando há produtos (não mostra "0").
  - Dá um pequeno "salto" sempre que o número aumenta.
  - Acima de 99 mostra "99+".
*/
const CartIcon = () => {
  const { count } = useCart();
  const [pulse, setPulse] = useState(false);
  const anterior = useRef(count);

  useEffect(() => {
    if (count > anterior.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 450);
      anterior.current = count;
      return () => clearTimeout(t);
    }
    anterior.current = count;
  }, [count]);

  const label = count === 0 ? 'Carrinho vazio' : `Carrinho com ${count} ${count === 1 ? 'produto' : 'produtos'}`;

  return (
    <Link to="/cart" aria-label={label} className="nav-icons relative inline-flex items-center justify-center w-9 h-9">
      <FaShoppingCart aria-hidden="true" />
      {count > 0 && (
        <span
          className={`cart-badge absolute -top-1 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full
                      flex items-center justify-center text-[11px] leading-none font-bold text-white
                      ${pulse ? 'cart-badge-pulse' : ''}`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;
