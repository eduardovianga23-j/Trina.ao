/*
  Limite de pedidos (contra robôs que tentam milhares de senhas, ou spam).
  Guarda as contagens em memória: chega para uma loja com um servidor.
  rateLimit({ windowMs, max, key, message }) → middleware do Express
*/
const buckets = new Map(); // nome → Map(chave → [datas])

export const clientIp = (req) => req.ip || req.socket?.remoteAddress || 'desconhecido';

export const hit = (name, key, windowMs) => {
  if (!buckets.has(name)) buckets.set(name, new Map());
  const map = buckets.get(name);
  const now = Date.now();
  const list = (map.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  map.set(key, list);
  if (map.size > 10000) map.clear(); // não deixa a memória crescer sem fim
  return { count: list.length, retryInMs: windowMs - (now - list[0]) };
};

export const reset = (name, key) => buckets.get(name)?.delete(key);

// Conta sem acrescentar (ex.: saber quantas tentativas falhadas já houve)
export const peek = (name, key, windowMs) => {
  const now = Date.now();
  const list = (buckets.get(name)?.get(key) || []).filter((t) => now - t < windowMs);
  return { count: list.length, retryInMs: list.length ? windowMs - (now - list[0]) : 0 };
};

export const rateLimit = ({ name, windowMs, max, key = clientIp, message }) => (req, res, next) => {
  const { count, retryInMs } = hit(name, key(req), windowMs);
  if (count > max) {
    const min = Math.max(1, Math.ceil(retryInMs / 60000));
    res.set('Retry-After', String(Math.ceil(retryInMs / 1000)));
    return res.status(429).json({ message: message || `Demasiados pedidos seguidos. Tenta de novo daqui a ${min} ${min === 1 ? 'minuto' : 'minutos'}.` });
  }
  next();
};

// Para os testes
export const _resetAll = () => buckets.clear();
