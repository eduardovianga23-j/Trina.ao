import { createContext, useContext, useEffect, useState } from 'react';

/*
  Carrinho da Trina.ao
  - Guarda os produtos no navegador (localStorage), por isso não se perdem ao recarregar a página.
  - O mesmo produto com tamanho ou cor diferente conta como uma linha separada.
  - Preços em euros.
  - Use em qualquer componente com:  const { count, addItem } = useCart();
*/

const CartContext = createContext(null);
const STORAGE_KEY = 'trina_cart_v2'; // v2 = produtos vindos da base de dados, em euros

const lerCarrinho = () => {
  try {
    localStorage.removeItem('trina_cart'); // carrinho antigo (preços em Kwanza)
    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(lerCarrinho);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* navegador sem armazenamento (ex.: modo privado): o carrinho funciona só nesta visita */
    }
  }, [items]);

  // addItem(produtoDaAPI, { size, color: {name, hex}, quantity })
  const addItem = (product, { size = '', color = null, quantity = 1 } = {}) => {
    const key = [product._id, size, color?.name || ''].join('|');
    setItems((prev) => {
      const existente = prev.find((i) => i.key === key);
      if (existente) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [
        ...prev,
        {
          key,
          productId: product._id,
          slug: product.slug,
          name: product.name,
          image: product.images?.[0] || '',
          price: product.price,
          size,
          color,
          quantity,
        },
      ];
    });
  };

  const removeItem = (key) => setItems((prev) => prev.filter((i) => i.key !== key));

  const updateQuantity = (key, quantity) => {
    if (quantity < 1) return removeItem(key);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity } : i)));
  };

  const clearCart = () => setItems([]);

  const count = items.reduce((acc, i) => acc + i.quantity, 0);
  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, count, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart tem de ser usado dentro de <CartProvider>');
  return ctx;
};
