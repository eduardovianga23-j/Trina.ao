import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEnvelope, faUserLarge } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  return (
    <div className='w-full h-screen items-center justify-center flex' style={{backgroundColor:'#686464'}}>
      <div className='bg-white w-[95%] sm:w-[30%] h-max flex-col items-center justify-center rounded-md p-6'>
        <h1 className='flex items-center justify-center p-3 mt-3 text-lg font-extrabold'>Cadastra-se</h1>
        <div className='flex items-center justify-center mb-6'>
          <div className='w-[80px] h-[8px] bg-red-700 rounded-lg'></div>
        </div>
        <div className="flex flex-col gap-6 items-center">
          <div className="flex items-center w-[300px] h-[60px] rounded-md bg-zinc-300">
            <FontAwesomeIcon icon={faUserLarge} className='p-4'/>
            <input className='w-[250px] h-[60px] bg-transparent outline-none text-sm' type="text" placeholder='Nome'/>
          </div>
          <div className="flex items-center w-[300px] h-[60px] rounded-md bg-zinc-300">
            <FontAwesomeIcon icon={faEnvelope} className='p-4'/>
            <input className='w-[250px] h-[60px] bg-transparent outline-none text-sm' type="email" placeholder='Email'/>
          </div>
          <div className="flex items-center w-[300px] h-[60px] rounded-md bg-zinc-300">
            <FontAwesomeIcon icon={faLock} className='p-4'/>
            <input className='w-[250px] h-[60px] bg-transparent outline-none text-sm' type="password" placeholder='Senha'/>
          </div>
          <button className='w-[300px] h-[50px] bg-red-800 hover:bg-red-900 text-white text-sm rounded-md'>Registar</button>
          <span onClick={()=>navigate("/login")} className='text-sm cursor-pointer mb-6'>Já tens uma conta?<span className='font-bold'>Iniciar sessão</span></span>
        </div>
      </div>
    </div>
  );
};
export default Register;
