import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Campo de formulário com ícone, usado no Login e no Registo
const AuthField = ({ icon, label, ...props }) => (
  <label className="flex items-center w-full h-[56px] rounded-md bg-zinc-300 focus-within:ring-2 focus-within:ring-red-800">
    <FontAwesomeIcon icon={icon} className='p-4' aria-hidden="true" />
    <span className="sr-only">{label}</span>
    <input className='flex-1 min-w-0 h-full pr-3 bg-transparent outline-none text-base sm:text-sm' placeholder={label} {...props} />
  </label>
);

export default AuthField;
