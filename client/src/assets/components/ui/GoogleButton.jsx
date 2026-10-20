import { useEffect, useRef, useState } from 'react';
import { authAPI } from '../../../services/api';

/*
  Botão oficial "Continuar com o Google" (Google Identity Services).
  - Só aparece se o servidor tiver GOOGLE_CLIENT_ID configurado.
  - onCredential(credential) recebe o token da Google, que o servidor confirma.
*/
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise = null;
const loadGoogleScript = () =>
  (scriptPromise ||= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = () => { scriptPromise = null; reject(new Error('script')); };
    document.head.appendChild(s);
  }));

let configPromise = null;
const getClientId = () =>
  (configPromise ||= authAPI.googleConfig().then(({ data }) => data.clientId).catch(() => { configPromise = null; return null; }));

const GoogleButton = ({ onCredential, text = 'continue_with', disabled = false }) => {
  const box = useRef(null);
  const handler = useRef(onCredential);
  handler.current = onCredential;
  const [state, setState] = useState('loading'); // loading | ready | off | error

  useEffect(() => {
    let cancel = false;
    (async () => {
      const clientId = await getClientId();
      if (cancel) return;
      if (!clientId) return setState('off');
      try {
        await loadGoogleScript();
      } catch {
        return !cancel && setState('error');
      }
      if (cancel || !box.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (res) => res?.credential && handler.current?.(res.credential),
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      const width = Math.min(400, Math.max(220, Math.floor(box.current.parentElement?.clientWidth || 320)));
      window.google.accounts.id.renderButton(box.current, {
        type: 'standard', theme: 'outline', size: 'large', shape: 'rectangular',
        text, logo_alignment: 'center', width, locale: 'pt-PT',
      });
      setState('ready');
    })();
    return () => { cancel = true; };
  }, [text]);

  if (state === 'off') return null;
  return (
    <div>
      <div className="flex items-center gap-3 my-1" aria-hidden="true">
        <span className="flex-1 h-px bg-zinc-200" />
        <span className="text-xs text-zinc-400 uppercase tracking-wider">ou</span>
        <span className="flex-1 h-px bg-zinc-200" />
      </div>
      <div className={`flex justify-center min-h-[44px] mt-3 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        <div ref={box} />
        {state === 'loading' && <div className="w-full h-11 rounded-md bg-zinc-100 animate-pulse" aria-label="A carregar o botão do Google" />}
        {state === 'error' && <p className="text-xs text-zinc-500 text-center">Não foi possível carregar o botão do Google. Verifica a ligação à internet.</p>}
      </div>
    </div>
  );
};

export default GoogleButton;
