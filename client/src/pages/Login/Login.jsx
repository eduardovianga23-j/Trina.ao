import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  return (
    <div className='bg w-full h-screen items-center justify-center flex' style={{backgroundColor:'#686464'}}>
      <div className='bg-white w-[95%] sm:w-[50%] md:w-[30%] h-max flex-col items-center justify-center rounded-md p-6'>
        <h1 className='flex items-center justify-center p-3 mt-3 text-lg font-extrabold'>Conecta-se</h1>
        <div className='flex items-center justify-center mb-6'>
          <div className='w-[80px] h-[8px] bg-red-700 rounded-lg'></div>
        </div>
        <div className="flex flex-col gap-6 items-center">
          <div className="flex items-center w-[300px] h-[60px] rounded-md bg-zinc-300">
            <FontAwesomeIcon icon={faEnvelope} className='p-4'/>
            <input className='w-[250px] h-[60px] bg-transparent outline-none text-sm' type="email" placeholder='Email'/>
          </div>
          <div className="flex items-center w-[300px] h-[60px] rounded-md bg-zinc-300">
            <FontAwesomeIcon icon={faLock} className='p-4'/>
            <input className='w-[250px] h-[60px] bg-transparent outline-none text-sm' type="password" placeholder='Senha'/>
          </div>
          <button className='w-[300px] h-[50px] bg-red-800 hover:bg-red-900 text-white text-sm rounded-md'>Iniciar sessão</button>
          <div className="-mt-2 flex flex-col gap-1 w-[300px]">
            <span onClick={()=>navigate("/register")} className='text-sm cursor-pointer'>Não tens uma conta?<span className='font-bold'>Cadastre-se</span></span>
            <span className='text-sm cursor-pointer'>Esqueceu a senha?<span className='font-bold'>Redefinir senha</span></span>
          </div>
          <span className="flex items-center w-[300px] h-[50px] rounded-md bg-zinc-300 hover:bg-zinc-400 duration-300 text-sm cursor-pointer gap-2 mb-7 px-4">
            🇬 Iniciar sessão com o google
          </span>
        </div>
      </div>
    </div>
  );
};
export default Login;
