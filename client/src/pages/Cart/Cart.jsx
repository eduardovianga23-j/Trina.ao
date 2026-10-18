import Header from "../../assets/components/header/Header";
import TopHeader from "../../assets/components/topheader/TopHeader";
import Footer from "../../assets/components/footer/footer";

const Cart = () => (
  <>
    <TopHeader />
    <Header />
    <div className="mt-[110px] min-h-[60vh] px-4 flex items-center justify-center">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-400">Carrinho vazio</h1>
    </div>
    <Footer />
  </>
);
export default Cart;
