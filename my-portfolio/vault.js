/**
 * Private Document Vault — AES-256 Encrypted File Storage
 * Only accessible with valid admin JWT
 */
const router = require('express').Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { pool } = require('../db');

const VAULT_DIR = path.join(__dirname, '../../vault_encrypted');
if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','application/pdf'];
    if (!allowed.includes(file.mimetype))
      return cb(new Error('Only JPG, PNG, and PDF files allowed'));
    cb(null, true);
  }
});

// Encrypt and save file to vault
function encryptFile(buffer) {
  const key = Buffer.from(process.env.VAULT_ENCRYPTION_KEY, 'hex'); // 32 bytes
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { encrypted, iv: iv.toString('hex') };
}

// Decrypt file from vault
function decryptFile(encryptedBuffer, ivHex) {
  const key = Buffer.from(process.env.VAULT_ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

// GET /api/vault — List files (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, label, file_type, file_size, created_at FROM vault_files WHERE is_deleted = FALSE ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/vault/upload — Upload and encrypt file (admin only)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { label } = req.body;
    const { encrypted, iv } = encryptFile(req.file.buffer);
    const fileId = crypto.randomUUID();
    const encryptedPath = path.join(VAULT_DIR, `${fileId}.enc`);
    fs.writeFileSync(encryptedPath, Buffer.concat([Buffer.from(iv + ':'), encrypted]));

    await pool.query(
      'INSERT INTO vault_files (id, label, encrypted_path, file_type, file_size) VALUES ($1, $2, $3, $4, $5)',
      [fileId, label, encryptedPath, req.file.mimetype, req.file.size]
    );

    res.json({ message: 'File encrypted and stored securely', id: fileId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/vault/:id/download — Download and decrypt file (admin only)
router.get('/:id/download', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vault_files WHERE id = $1 AND is_deleted = FALSE',
      [req.params.id]
    );
    const file = result.rows[0];
    if (!file) return res.status(404).json({ error: 'File not found' });

    const rawData = fs.readFileSync(file.encrypted_path);
    const colonIdx = rawData.indexOf(':');
    const iv = rawData.slice(0, colonIdx).toString();
    const encrypted = rawData.slice(colonIdx + 1);
    const decrypted = decryptFile(encrypted, iv);

    res.setHeader('Content-Type', file.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.label}"`);
    res.send(decrypted);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

// DELETE /api/vault/:id — Soft delete (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('UPDATE vault_files SET is_deleted = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'File removed from vault' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
