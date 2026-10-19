# Trina.ao — E-commerce MERN

Loja online de moda construída com MongoDB, Express, React e Node.js. Preços em euros.

## Estrutura

```
Trina.ao/
├── client/     # Site: React + Vite + Tailwind
└── server/     # API: Node.js + Express + MongoDB
```

## Primeira vez

Precisas do **MongoDB** a correr no teu computador.

### 1. Servidor
```bash
cd server
npm install
cp .env.example .env      # no Windows (PowerShell): copy .env.example .env
```
Abre o `server/.env` e preenche o `JWT_SECRET`. Para gerar um:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Depois:
```bash
npm run seed           # cria 6 produtos de exemplo (opcional)
npm run create-admin   # cria a tua conta de administrador
npm run dev            # liga o servidor em http://localhost:5000
```

### 2. Site (noutro terminal)
```bash
cd client
npm install
npm run dev            # abre em http://localhost:5173
```

## Área de administração

Entra com a conta de administrador e abre **/admin** (ou usa o menu da conta → "Painel de administração").

- Criar, editar, esconder e apagar produtos
- Fotos: mínimo 2, máximo 4 (a primeira é a principal)
- Tamanhos à escolha; sem tamanhos = tamanho único
- Cores só aparecem se "Este produto tem várias cores?" estiver ligado
- "Combina com": até 4 produtos sugeridos em "Você também pode comprar"
  (se não escolheres, o site sugere produtos da mesma categoria)

## Fotos dos produtos

- **No teu PC:** ficam em `server/uploads/` (esta pasta não vai para o GitHub).
- **Online:** cria uma conta grátis no [Cloudinary](https://cloudinary.com), copia o
  "API environment variable" e coloca-o em `CLOUDINARY_URL` no `.env`. Não é preciso mudar código.

## Comandos úteis (pasta `server`)

| Comando | O que faz |
|---|---|
| `npm run dev` | Liga o servidor e reinicia ao guardar ficheiros |
| `npm run create-admin` | Cria um administrador (ou promove uma conta existente) |
| `npm run seed` | Cria produtos de exemplo se a loja estiver vazia |
| `npm run seed -- --force` | Apaga os produtos e volta a criar os de exemplo |

## Tecnologias

**Site:** React 18, Vite, Tailwind CSS, React Router, Axios
**Servidor:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Multer, Cloudinary (opcional)
