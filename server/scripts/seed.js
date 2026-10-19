/*
  Coloca na base de dados os produtos de exemplo que antes estavam escritos no código do site.
  Uso:  npm run seed            (só se ainda não houver produtos)
        npm run seed -- --force (apaga os produtos e volta a criar)
*/
import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const img = (id) => `https://images.unsplash.com/${id}?w=800&q=80`;
const I = {
  salto: img('photo-1543163521-1bf539c55dd2'),
  tenis: img('photo-1542291026-7eec264c27ff'),
  oculos: img('photo-1572635196237-14b3f281503f'),
  moda1: img('photo-1558618666-fcd25c85cd64'),
  moda2: img('photo-1509631179647-0177331693ae'),
  moda3: img('photo-1483985988355-763728e1935b'),
};
const shoes = ['36', '37', '38', '39', '40'];
const clothes = ['XS', 'S', 'M', 'L', 'XL'];

const products = [
  { name: 'Salto Azalea', category: 'sapatos', price: 49.9, originalPrice: 65.0, images: [I.salto, I.moda1, I.moda2], sizes: shoes,
    hasColors: true, colors: [{ name: 'Azul floral', hex: '#2B6CB0' }, { name: 'Preto', hex: '#111111' }],
    description: 'Salto alto com padrão floral e salto grosso, confortável para o dia todo.', featured: true },
  { name: 'Calça Your', category: 'roupas', price: 39.9, images: [I.moda2, I.moda3], sizes: clothes,
    description: 'Calça de ganga "Your rules" em dois tons, corte direito.', featured: true },
  { name: 'Óculos de Sol Desert Rider', category: 'acessórios', price: 29.9, originalPrice: 34.9, images: [I.oculos, I.moda3], sizes: [],
    description: 'Óculos de sol de estilo clássico com proteção UV400.', featured: true },
  { name: 'Ténis Mariella Strass', category: 'sapatos', price: 59.9, originalPrice: 69.9, images: [I.tenis, I.moda1], sizes: shoes,
    hasColors: true, colors: [{ name: 'Vermelho', hex: '#BB0320' }, { name: 'Branco', hex: '#F5F5F5' }],
    description: 'Ténis em malha respirável com detalhes em strass.', featured: true },
  { name: 'Vestido Midi Elegance', category: 'roupas', price: 54.9, originalPrice: 64.9, images: [I.moda1, I.moda2, I.moda3], sizes: clothes,
    hasColors: true, colors: [{ name: 'Lilás', hex: '#BB0390' }, { name: 'Rosa', hex: '#FF69B4' }],
    description: 'Vestido midi fluido, ideal para eventos e jantares.' },
  { name: 'Conjunto Desportivo Move', category: 'desporto', price: 44.9, images: [I.moda2, I.moda1], sizes: clothes,
    description: 'Conjunto de top e leggings em tecido elástico de secagem rápida.' },
];

try {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trina_ao');
  const force = process.argv.includes('--force');
  const count = await Product.countDocuments();
  if (count > 0 && !force) {
    console.log(`ℹ️  Já existem ${count} produtos. Nada foi alterado. Usa "npm run seed -- --force" para recomeçar.`);
  } else {
    if (force) await Product.deleteMany({});
    const created = [];
    for (const p of products) created.push(await Product.create(p));
    // "Combina com": o salto sugere o vestido e os óculos
    const by = (n) => created.find((p) => p.name === n)._id;
    await Product.updateOne({ _id: by('Salto Azalea') }, { related: [by('Vestido Midi Elegance'), by('Óculos de Sol Desert Rider')] });
    console.log(`✅ ${created.length} produtos de exemplo criados.`);
  }
} catch (err) {
  console.error('❌', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
