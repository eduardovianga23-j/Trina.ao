import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  return (
    <div className='bg w-full min-h-screen items-center justify-center flex px-4 py-10' style={{backgroundColor:'#686464'}}>
      <div className='bg-white w-full max-w-sm rounded-md p-5 sm:p-8'>
        <h1 className='flex items-center justify-center p-3 mt-3 text-lg font-extrabold'>Conecta-se</h1>
        <div className='flex items-center justify-center mb-6'>
          <div className='w-[80px] h-[8px] bg-red-700 rounded-lg'></div>
        </div>
        <div className="flex flex-col gap-5 items-stretch">
          <div className="flex items-center w-full h-[56px] rounded-md bg-zinc-300">
            <FontAwesomeIcon icon={faEnvelope} className='p-4'/>
            <input className='flex-1 min-w-0 h-full pr-3 bg-transparent outline-none text-base sm:text-sm' type="email" placeholder='Email'/>
          </div>
          <div className="flex items-center w-full h-[56px] rounded-md bg-zinc-300">
            <FontAwesomeIcon icon={faLock} className='p-4'/>
            <input className='flex-1 min-w-0 h-full pr-3 bg-transparent outline-none text-base sm:text-sm' type="password" placeholder='Senha'/>
          </div>
          <button className='w-full h-[50px] bg-red-800 hover:bg-red-900 text-white text-sm rounded-md'>Iniciar sessão</button>
          <div className="-mt-1 flex flex-col gap-2">
            <span onClick={()=>navigate("/register")} className='text-sm cursor-pointer'>Não tens uma conta?<span className='font-bold ml-1'>Cadastre-se</span></span>
            <span className='text-sm cursor-pointer'>Esqueceu a senha?<span className='font-bold ml-1'>Redefinir senha</span></span>
          </div>
          <span className="flex items-center justify-center w-full h-[50px] rounded-md bg-zinc-300 hover:bg-zinc-400 duration-300 text-sm cursor-pointer gap-2 mb-7 px-4">
            🇬 Iniciar sessão com o google
          </span>
        </div>
      </div>
    </div>
  );
};
export default Login;
