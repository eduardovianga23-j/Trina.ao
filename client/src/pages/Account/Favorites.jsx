import { Link, Navigate } from 'react-router-dom';
import Header from '../../assets/components/header/Header';
import TopHeader from '../../assets/components/topheader/TopHeader';
import Footer from '../../assets/components/footer/footer';
import FavoritesList from './FavoritesList';
import { useAuth } from '../../context/AuthContext';

// /favoritos — para quem não tem sessão (com sessão, vai para /conta/favoritos)
const Favorites = () => {
  const { user, checking } = useAuth();
  if (!checking && user) return <Navigate to="/conta/favoritos" replace />;
  return (
    <>
      <TopHeader />
      <Header />
      <main className="mt-[110px] bg-zinc-50 min-h-[70vh]">
        <div className="container-site py-6 sm:py-10">
          <h1 className="text-xl sm:text-2xl font-bold">Favoritos</h1>
          <p className="text-sm text-zinc-600 mt-1 mb-6">
            Os teus favoritos ficam guardados neste dispositivo.{' '}
            <Link to="/login" state={{ from: '/conta/favoritos' }} className="font-semibold text-red-800 hover:underline">Entra na tua conta</Link>{' '}
            para os teres em qualquer lado.
          </p>
          <FavoritesList />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Favorites;
