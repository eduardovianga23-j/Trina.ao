import { faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import calcaYour from '../../../img/TRINA/calcaYour.jpg';
import tenisMariela from '../../../img/TRINA/tenisMariela.jpg';
import oculos_sol2 from '../../../img/TRINA/oculos_sol2.jpg';
import saltoAzalea from '../../../img/TRINA/saltoAzalea.jpg';
import { useEffect, useState } from 'react';
import PromoDataCard from "./PromoDataCard";

const PromoData = [
    {
        img: saltoAzalea,
        nomeProduto: "Salto Azalea",
        detalhesProduto1: "Salto grosso tone",
        detalhesProduto2: "Camisola de manga comprida com estampado leopardo para senhora. Camisola de manga comprida com decote redondo em fios luréx para efeito brilhante.",
        tamanhos: "36, 38, 39",
        percentagem: -24,
        precoAnterior: "25,050",
        precoActual : "15,000",
      },
      {
        img: calcaYour,
        nomeProduto: "Calça Your",
        detalhesProduto1: "Your rules jeans two tone",
        detalhesProduto2: "Camisola de manga comprida com estampado leopardo para senhora. Camisola de manga comprida com decote redondo em fios luréx para efeito brilhante.",
        tamanhos: "35, 36, 37, 38, 39",
        percentagem: 0,
        precoAnterior: "35,050",
        precoActual : "25,030",
      },
      {
        img: oculos_sol2,
        nomeProduto: "Óculos Sol",
        detalhesProduto1: "Desert Rider",
        detalhesProduto2: "Camisola de manga comprida com estampado leopardo para senhora. Camisola de manga comprida com decote redondo em fios luréx para efeito brilhante.",
        tamanhos: "",
        percentagem: -4,
        precoAnterior: "19,056",
        precoActual : "11,065",
      },
      {
        img: tenisMariela,
        nomeProduto: "Ténis Mariella Strass",
        detalhesProduto1: "Mariella Strass",
        detalhesProduto2: "Camisola de manga comprida com estampado leopardo para senhora. Camisola de manga comprida com decote redondo em fios luréx para efeito brilhante.",
        tamanhos: "37, 38, 39",
        title: "Calça Your",
        percentagem: -10,
        precoAnterior: "24,044",
        precoActual : "15,230",
      },
  ];

const Promo = () =>{

  // Estado para armazenar a hora atual
  const [currentTime, setCurrentTime] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    // Função para atualizar a hora atual
    const updateTime = () => {
      const now = new Date();
      setCurrentTime({
        hours: now.getHours().toString().padStart(2, '0'),
        minutes: now.getMinutes().toString().padStart(2, '0'),
        seconds: now.getSeconds().toString().padStart(2, '0'),
      });
    };

    // Atualiza a hora a cada segundo
    const timerInterval = setInterval(updateTime, 1000);

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(timerInterval);
  }, []);

    return(
        
        <div className='h-full  items-center flex bg-gray-100 flex-col justify-center '>
            <section className='w-full h-10 bg-red-800 p-7 flex items-center  justify-between'> 
                  
            </section>


          <section className="flex items-center justify-center my-6">   
            <div className=" w-11/12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8 lg:gap-4">
                {PromoData.map((item, index) =>(
                  <PromoDataCard 
                  key={index}
                  {...item} 
                  />
                ))}
            </div>
          </section>
        </div>
    )
}

export default Promo;