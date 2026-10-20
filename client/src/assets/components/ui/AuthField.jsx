import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// Campo de formulário com ícone, usado no Login e no Registo.
// Nos campos de senha aparece um olho para mostrar/esconder o que se escreveu.
const AuthField = ({ icon, label, type, ...props }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <label className="flex items-center w-full h-[56px] rounded-md bg-zinc-300 focus-within:ring-2 focus-within:ring-red-800">
      <FontAwesomeIcon icon={icon} className='p-4' aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input className='flex-1 min-w-0 h-full pr-3 bg-transparent outline-none text-base sm:text-sm' placeholder={label}
        type={isPassword && show ? 'text' : type} {...props} />
      {isPassword && (
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Esconder a senha' : 'Mostrar a senha'}
          className="w-11 h-full flex items-center justify-center text-zinc-600 hover:text-black">
          {show ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
        </button>
      )}
    </label>
  );
};

export default AuthField;
