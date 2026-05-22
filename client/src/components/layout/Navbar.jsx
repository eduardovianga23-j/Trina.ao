import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/produtos?search=${search}`);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-dark">
            Trina<span className="text-brand-600">.ao</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-body font-medium text-stone-600">
            <Link to="/produtos" className="hover:text-brand-600 transition-colors">Produtos</Link>
            <Link to="/produtos?category=roupas" className="hover:text-brand-600 transition-colors">Roupas</Link>
            <Link to="/produtos?category=acessórios" className="hover:text-brand-600 transition-colors">Acessórios</Link>
            <Link to="/produtos?category=sapatos" className="hover:text-brand-600 transition-colors">Sapatos</Link>
          </div>

          {/* Search + icons */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="hidden md:flex items-center border border-stone-300 px-3 py-1.5">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="text-sm outline-none w-40 font-body"
              />
              <button type="submit"><Search size={15} className="text-stone-400" /></button>
            </form>

            <Link to="/carrinho" className="relative">
              <ShoppingBag size={20} className="text-dark hover:text-brand-600 transition-colors" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link to="/admin"><LayoutDashboard size={20} className="text-dark hover:text-brand-600 transition-colors" /></Link>
                )}
                <button onClick={logout}><LogOut size={20} className="text-dark hover:text-brand-600 transition-colors" /></button>
              </div>
            ) : (
              <Link to="/auth/login"><User size={20} className="text-dark hover:text-brand-600 transition-colors" /></Link>
            )}

            <button className="md:hidden" onClick={() => setOpen(!open)}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-stone-200 py-4 flex flex-col gap-4 text-sm font-body">
            <Link to="/produtos" onClick={() => setOpen(false)}>Todos os Produtos</Link>
            <Link to="/produtos?category=roupas" onClick={() => setOpen(false)}>Roupas</Link>
            <Link to="/produtos?category=acessórios" onClick={() => setOpen(false)}>Acessórios</Link>
            <Link to="/produtos?category=sapatos" onClick={() => setOpen(false)}>Sapatos</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
