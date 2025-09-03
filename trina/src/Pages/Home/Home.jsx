import './Home.css';
import Footer from '../../assets/components/footer/footer';
import Header from '../../assets/components/header/Header';
import HomeBack from '../../assets/components/homeBack/HomeBack';
import Promo from '../../assets/components/promo/Promo';
import TopHeader from '../../assets/components/topheader/TopHeader';
import BestProd from '../../assets/components/BestProd/BestProd';
import Banner from '../../assets/components/banner/banner';





const Home = () =>{
  
    return(
        <>
        <TopHeader />
        <Header />
        <HomeBack />
        <Promo />
        <BestProd />
        <Banner />
        <Footer />
        </>
    )
    
}


export default Home;