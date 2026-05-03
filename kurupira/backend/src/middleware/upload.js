const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/catalog');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Verifica magic bytes do arquivo salvo em disco.
// Retorna o mime type real ou null se não reconhecido.
function detectMimeFromDisk(filePath) {
  let fd;
  try {
    const buf = Buffer.alloc(12);
    fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buf, 0, 12, 0);
    if (bytesRead < 3) return null;

    // JPEG: FF D8 FF
    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
    // WebP: RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
    if (bytesRead >= 12 &&
        buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
        buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
      return 'image/webp';
    }
    return null;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) try { fs.closeSync(fd); } catch {}
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, req.params.id + '-' + uniqueSuffix + '.webp');
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.'), false);
    }
    cb(null, true);
  }
});

// Middleware pós-upload: valida magic bytes reais do arquivo salvo.
// Remove o arquivo e retorna 400 se o conteúdo não bater com a extensão.
function validateMagicBytes(req, res, next) {
  if (!req.file) return next();

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  const realMime = detectMimeFromDisk(req.file.path);

  if (!realMime || !allowed.includes(realMime)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({
      success: false,
      error: 'Conteúdo do arquivo não corresponde a uma imagem válida (JPEG, PNG ou WebP).'
    });
  }

  next();
}

module.exports = { upload, uploadDir, validateMagicBytes };
