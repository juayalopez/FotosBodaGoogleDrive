const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Google Drive setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// Multer setup
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 1 * 1024 * 1024 * 1024, // 1GB max
  },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const maxSize = isImage ? 50 * 1024 * 1024 : 1 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      return cb(new Error('Archivo demasiado grande'));
    }
    if (isImage || isVideo) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido'));
  },
});

app.use(express.static('public'));

app.post('/upload', upload.array('files'), async (req, res) => {
  try {
    for (const file of req.files) {
      await drive.files.create({
        requestBody: {
          name: file.originalname,
          parents: ['1r2zO7uBj4UBX0951eyNAX4BPMnCXACyN'], // ID carpeta destino
        },
        media: {
          mimeType: file.mimetype,
          body: fs.createReadStream(file.path),
        },
      });
      // Borra el archivo temporal
      fs.unlinkSync(file.path);
    }

    res.status(200).send('Subido correctamente.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al subir: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
