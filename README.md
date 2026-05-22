# Trina.ao — E-commerce MERN

Plataforma de e-commerce angolana construída com MongoDB, Express, React e Node.js.

## Estrutura

```
Trina.ao/
├── client/     # Frontend React + Vite + Tailwind
└── server/     # Backend Node.js + Express + MongoDB
```

## Como correr

### Backend
```bash
cd server
npm install
# Edita o ficheiro .env com as tuas credenciais
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Tecnologias

**Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios  
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt

## Variáveis de ambiente (server/.env)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/trina_ao
JWT_SECRET=trina_secret_key_change_this_in_production
CLIENT_URL=http://localhost:5173
```
