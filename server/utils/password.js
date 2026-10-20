import crypto from 'crypto';

/*
  Regras das senhas novas (registo, recuperar e mudar a senha).
  Devolve uma mensagem de erro, ou null se a senha for boa.
*/
const COMMON = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'qwertyui', 'qwerty123', '11111111',
  '00000000', 'abcdefgh', 'iloveyou', 'senha123', 'senha1234', 'portugal', 'benfica1', 'sporting', 'trina123',
  'abc12345', 'admin123', 'aaaaaaaa', '87654321', 'palavrapasse',
]);

export const MIN_PASSWORD = 8;

export const passwordProblem = (password, { email = '', name = '' } = {}) => {
  const p = String(password || '');
  if (p.length < MIN_PASSWORD) return `A senha tem de ter pelo menos ${MIN_PASSWORD} caracteres`;
  if (p.length > 128) return 'A senha é demasiado comprida (máximo 128 caracteres)';
  const lower = p.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(p)) return 'Essa senha é muito fácil de adivinhar. Escolhe outra.';
  const local = String(email).split('@')[0].toLowerCase();
  if ((local.length >= 4 && lower.includes(local)) || (name && lower === String(name).toLowerCase().replace(/\s+/g, ''))) {
    return 'A senha não pode ser o teu nome ou o teu email.';
  }
  return null;
};

// Código para o link de recuperação (vai no email) e o resumo que fica guardado
export const newResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
};
export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
