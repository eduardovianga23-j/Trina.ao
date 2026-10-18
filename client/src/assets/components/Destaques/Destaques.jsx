import calcaYour from '../../../img/TRINA/calcaYour.jpg';
import macacaoJamama from '../../../img/TRINA/macacaoJamama.jpg';
import saltoAzalea from '../../../img/TRINA/saltoAzalea.jpg';
import DestaquesDataCard from './DestaquesDataCard';

const DestaquesData = [
    {
      img: calcaYour,
    },
    {
      img: macacaoJamama,
    },
    {
      img: saltoAzalea,
    },
    {
    img: calcaYour,
    },
    {
    img: macacaoJamama,
    },
    {
    img: saltoAzalea,
    },
  ];  

const Destaques = () =>{
    return(
        <div  className='w-full bg-blue-400 items-center flex justify-center py-10 my-16'>
        <section data-aos="fade-up" className='container-site'>
          <h2 className='mb-10 border-l-8 text-sm sm:text-lg font-semibold'>Conheça os nossos estilos, e liberte a essência que há em ti</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
                 {DestaquesData.map((item, index) =>(
                  <DestaquesDataCard
                  key={index}
                  {...item} 
                  />
                ))}
            </div>
        </section>
      </div>
    )
}

export default Destaques;