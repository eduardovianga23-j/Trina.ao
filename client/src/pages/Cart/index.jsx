import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Cart() {
  const { items, removeItem, updateQuantity, total, count } = useCart();

  if (count === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <ShoppingBag size={48} className="text-stone-300 mx-auto mb-6" />
        <h2 className="font-display text-2xl font-bold mb-3">O teu carrinho está vazio</h2>
        <p className="font-body text-stone-500 mb-8">Adiciona alguns produtos para continuar.</p>
        <Link to="/produtos" className="btn-primary">Ver Produtos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-bold mb-10">Carrinho ({count})</h1>
      <div className="grid md:grid-cols-3 gap-12">
        {/* Items */}
        <div className="md:col-span-2 space-y-6">
          {items.map((item) => (
            <div key={item.product} className="flex gap-4 pb-6 border-b border-stone-100">
              <div className="w-24 h-32 bg-stone-100 shrink-0 overflow-hidden">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <h3 className="font-body font-medium text-sm">{item.name}</h3>
                <p className="font-body text-brand-600 font-semibold mt-1">
                  {item.price.toLocaleString('pt-AO')} Kz
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={() => updateQuantity(item.product, item.quantity - 1)}
                    className="border border-stone-300 w-7 h-7 flex items-center justify-center hover:border-dark transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="font-body text-sm w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product, item.quantity + 1)}
                    className="border border-stone-300 w-7 h-7 flex items-center justify-center hover:border-dark transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <span className="font-body font-semibold text-sm">
                  {(item.price * item.quantity).toLocaleString('pt-AO')} Kz
                </span>
                <button onClick={() => removeItem(item.product)}>
                  <Trash2 size={16} className="text-stone-400 hover:text-red-500 transition-colors" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-stone-50 p-6 h-fit">
          <h2 className="font-display text-lg font-bold mb-6">Resumo</h2>
          <div className="space-y-3 text-sm font-body">
            <div className="flex justify-between">
              <span className="text-stone-600">Subtotal</span>
              <span>{total.toLocaleString('pt-AO')} Kz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Envio</span>
              <span>{total >= 5000 ? 'Grátis' : '500 Kz'}</span>
            </div>
            <div className="border-t border-stone-200 pt-3 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="text-brand-600">{(total + (total >= 5000 ? 0 : 500)).toLocaleString('pt-AO')} Kz</span>
            </div>
          </div>
          <Link to="/checkout" className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
            Finalizar Compra <ArrowRight size={16} />
          </Link>
          <Link to="/produtos" className="block text-center text-sm text-stone-500 mt-4 hover:text-dark font-body transition-colors">
            Continuar a comprar
          </Link>
        </div>
      </div>
    </div>
  );
}
