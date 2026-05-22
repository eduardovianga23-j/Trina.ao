import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark text-stone-400 font-body mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h3 className="font-display text-white text-2xl mb-4">Trina<span className="text-brand-500">.ao</span></h3>
          <p className="text-sm leading-relaxed">
            Moda angolana moderna. Qualidade e estilo para cada ocasião.
          </p>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-4 tracking-widest uppercase">Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/produtos" className="hover:text-white transition-colors">Produtos</Link></li>
            <li><Link to="/auth/login" className="hover:text-white transition-colors">Minha Conta</Link></li>
            <li><Link to="/carrinho" className="hover:text-white transition-colors">Carrinho</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-4 tracking-widest uppercase">Contacto</h4>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors"><Instagram size={18} /></a>
            <a href="#" className="hover:text-white transition-colors"><Facebook size={18} /></a>
            <a href="mailto:info@trina.ao" className="hover:text-white transition-colors"><Mail size={18} /></a>
          </div>
          <p className="text-sm mt-4">info@trina.ao</p>
          <p className="text-sm">Luanda, Angola</p>
        </div>
      </div>
      <div className="border-t border-stone-800 text-center py-4 text-xs">
        © {new Date().getFullYear()} Trina.ao — Todos os direitos reservados
      </div>
    </footer>
  );
}
