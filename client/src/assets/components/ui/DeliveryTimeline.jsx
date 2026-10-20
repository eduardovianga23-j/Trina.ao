import { FaCheck } from 'react-icons/fa';
import { deliverySteps, fmtDateTime } from '../../../utils/orders';

// Linha do tempo da entrega: Pago → A caminho → Entregue → Recebida pelo cliente
const DeliveryTimeline = ({ order, compact = false }) => {
  const steps = deliverySteps(order);
  const current = steps.findIndex((s) => !s.date); // primeiro passo por fazer
  return (
    <ol className={`grid gap-0 ${compact ? 'text-xs' : 'text-sm'}`}>
      {steps.map((s, i) => {
        const done = Boolean(s.date);
        const next = i === current;
        return (
          <li key={s.key} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${
                done ? 'bg-green-600 border-green-600 text-white' : next ? 'border-amber-500 bg-amber-50' : 'border-zinc-300 bg-white'}`}>
                {done ? <FaCheck size={10} aria-hidden="true" /> : next ? <span className="w-2 h-2 rounded-full bg-amber-500" /> : null}
              </span>
              {i < steps.length - 1 && <span className={`w-0.5 flex-1 min-h-[18px] ${steps[i + 1].date ? 'bg-green-600' : 'bg-zinc-200'}`} />}
            </span>
            <span className="pb-3">
              <span className={`block font-semibold ${done ? '' : next ? 'text-amber-800' : 'text-zinc-400'}`}>
                {s.label}{next && <span className="font-normal text-zinc-500"> · a seguir</span>}
              </span>
              {done && <span className="block text-zinc-500 text-xs">{fmtDateTime(s.date)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export default DeliveryTimeline;
