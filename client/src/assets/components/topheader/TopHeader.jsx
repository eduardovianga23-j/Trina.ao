import { useEffect, useState } from 'react';
import './TopHeader.css';

// Faixa preta do topo: esconde-se (desliza para cima) quando a pessoa faz scroll,
// para o cabeçalho poder subir até ao topo sem deixar espaço vazio.
const TopHeader = () => {
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const onScroll = () => setHidden(window.scrollY >= 80);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={`w-full top-0 left-0 h-10 fixed z-[55] flex bg-black justify-center items-center px-5
                        transition-transform duration-300 ease-out ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
        >
            <div className="flex justify-center items-center w-11/12">
                <span className='hidden sm:block sm:text-xs font-semibold text-white'>Não procure mais, você acaba de encontrar o lugar certo     |     LIBERDADE É O NOSSO ESTILO  - ONLINE SHOP</span>
                <span className='span-text block sm:hidden font-semibold text-white'>Liberdade é o nosso estilo     |    ONLINE SHOP</span>
            </div>
        </header>
    );
}

export default TopHeader;
