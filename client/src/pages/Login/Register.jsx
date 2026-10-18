import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEnvelope, faUserLarge } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  return (
    <div className='w-full min-h-screen items-center justify-center flex px-4 py-10' style={{backgroundColor:'#686464'}}>
      <div className='bg-white w-full max-w-sm rounded-md p-5 sm:p-8'>
        <h1 className='flex items-center justify-center p-3 mt-3 text-lg font-extrabold'>Cadastra-se</h1>
        <div className='flex items-center justify-center mb-6'>
          <div className='w-[80px] h-[8px] bg-red-700 rounded-lg'></div>
        </div>
        <div className="flex flex-col gap-5 items-stretch">
          <div className="flex items-center w-full h-[56px] rounded-md bg-zinc-300">
            <FontAwesomeIcon icon={faUserLarge} className='p-4'/>
            <input className='flex-1 min-w-0 h-full pr-3 bg-transparent outline-none text-base sm:text-sm' type="text" placeholder='Nome'/>
          </div>
          <div className="flex items-center w-full h-[56px] rounded-md bg-zinc-300">
            <FontAwesomeIcon icon={faEnvelope} className='p-4'/>
            <input className='flex-1 min-w-0 h-full pr-3 bg-transparent outline-none text-base sm:text-sm' type="email" placeholder='Email'/>
          </div>
          <div className="flex items-center w-full h-[56px] rounded-md bg-zinc-300">
            <FontAwesomeIcon icon={faLock} className='p-4'/>
            <input className='flex-1 min-w-0 h-full pr-3 bg-transparent outline-none text-base sm:text-sm' type="password" placeholder='Senha'/>
          </div>
          <button className='w-full h-[50px] bg-red-800 hover:bg-red-900 text-white text-sm rounded-md'>Registar</button>
          <span onClick={()=>navigate("/login")} className='text-sm text-center cursor-pointer mb-2'>Já tens uma conta?<span className='font-bold ml-1'>Iniciar sessão</span></span>
        </div>
      </div>
    </div>
  );
};
export default Register;
