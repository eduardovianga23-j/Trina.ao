import './TopHeader.css';

const TopHeader = () => {
    return (
        <header className='w-full top-0 left-0 h-10 fixed flex bg-black justify-center items-center p-5'>
            <div className="flex justify-center items-center w-11/12">
                <span className='hidden sm:block sm:text-xs font-semibold text-white'>Não procure mais, você acaba de encontrar o lugar certo     |     LIBERDADE É O NOSSO ESTILO  - ONLINE SHOP</span>     
                <span className='span-text block sm:hidden font-semibold text-white'>Liberdade é o nosso estilo     |    ONLINE SHOP</span>           
            </div>
        </header>
    );
}

export default TopHeader;
