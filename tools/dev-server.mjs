import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const ROOT = process.cwd();
const PORT = process.env.PORT || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer(async (req, res) => {
  // A query string sai ANTES de testar a raiz: "/?gclid=..." também é a home.
  // Testar req.url === '/' primeiro fazia o servidor tentar ler o diretório
  // como arquivo e devolver 404 em qualquer URL com parâmetros de campanha.
  const urlPath = req.url.split('?')[0];
  const filePath = join(ROOT, decodeURIComponent(urlPath === '/' ? '/index.html' : urlPath));
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => console.log(`dev server on http://localhost:${PORT}`));
