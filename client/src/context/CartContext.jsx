import { createContext, useContext, useEffect, useState } from 'react';

/*
  Carrinho da Trina.ao
  - Guarda os produtos no navegador (localStorage), por isso não se perdem ao recarregar a página.
  - O mesmo produto com tamanho ou cor diferente conta como uma linha separada.
  - Use em qualquer componente com:  const { count, addItem } = useCart();
*/

const CartContext = createContext(null);
const STORAGE_KEY = 'trina_cart';

// "15.000" -> 15000
export const parsePreco = (preco) => Number(String(preco ?? '').replace(/\./g, '').replace(',', '.')) || 0;

// 15000 -> "15.000"
export const formatPreco = (valor) => Math.round(valor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const lerCarrinho = () => {
  try {
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

  // produto: { nomeProduto, img, precoActual, precoAnterior?, tamanho?, cor? }
  const addItem = (produto, quantidade = 1) => {
    const id = [produto.nomeProduto, produto.tamanho || '', produto.cor || ''].join('|');
    setItems((prev) => {
      const existente = prev.find((i) => i.id === id);
      if (existente) {
        return prev.map((i) => (i.id === id ? { ...i, quantidade: i.quantidade + quantidade } : i));
      }
      return [
        ...prev,
        {
          id,
          nome: produto.nomeProduto,
          img: produto.img,
          preco: parsePreco(produto.precoActual),
          tamanho: produto.tamanho || '',
          cor: produto.cor || '',
          quantidade,
        },
      ];
    });
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id, quantidade) => {
    if (quantidade < 1) return removeItem(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantidade } : i)));
  };

  const clearCart = () => setItems([]);

  const count = items.reduce((acc, i) => acc + i.quantidade, 0);
  const total = items.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

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
