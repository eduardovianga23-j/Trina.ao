import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

/*
  Guarda as fotos dos produtos.
  - Sem configuração: guarda em server/uploads/ (ideal para desenvolvimento no teu PC).
  - Com CLOUDINARY_URL no .env: guarda no Cloudinary (recomendado quando o site estiver online).
*/

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
// Lido na hora (o .env é carregado no arranque do servidor)
const useCloudinary = () => Boolean(process.env.CLOUDINARY_URL);

export const storageMode = () => (useCloudinary() ? 'cloudinary' : 'local');

// Confirma o tipo pelo conteúdo do ficheiro (não confia só na extensão)
export const detectImageType = (buf) => {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
};

export const saveImage = async (buffer) => {
  const ext = detectImageType(buffer);
  if (!ext) throw Object.assign(new Error('Formato não suportado. Use JPG, PNG ou WEBP.'), { status: 400 });

  if (useCloudinary()) {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'trina/produtos', resource_type: 'image' }, (err, res) => (err ? reject(err) : resolve(res)))
        .end(buffer);
    });
    return result.secure_url;
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
};

// Apaga uma foto que já não é usada. Ignora fotos externas (ex.: Unsplash).
export const deleteImage = async (url) => {
  try {
    if (url.startsWith('/uploads/')) {
      const file = path.join(UPLOAD_DIR, path.basename(url));
      if (file.startsWith(UPLOAD_DIR)) await fs.unlink(file);
    } else if (useCloudinary() && url.includes('res.cloudinary.com')) {
      const publicId = url.split('/upload/')[1]?.replace(/^v\d+\//, '').replace(/\.[a-z0-9]+$/i, '');
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }
  } catch {
    /* se já não existir, não faz mal */
  }
};
