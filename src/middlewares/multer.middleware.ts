import multer from 'multer'
import path from 'path'
import fs from 'node:fs'
import AppError from '../errors/AppError'

export const maxUploadMb = Number.isFinite(Number(process.env.MAX_UPLOAD_MB)) && Number(process.env.MAX_UPLOAD_MB) > 0
  ? Number(process.env.MAX_UPLOAD_MB) : 100;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destination = path.join(__dirname, '../../uploads'); fs.mkdirSync(destination, { recursive: true }); cb(null, destination)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    )
  },
})

export const profileUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^\.(jpe?g|png)$/i.test(path.extname(file.originalname)) && ['image/jpeg', 'image/png', 'application/octet-stream'].includes(file.mimetype)) return cb(null, true);
    cb(new AppError(400, 'Choose a JPG or PNG profile photo under 5 MB'));
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|doc|ppt|mp4|webm|quicktime|mov|mpeg|mp3|m4a|wav|ogg|octet-stream|officedocument/
    const mimetype = filetypes.test(file.mimetype)
    const extname = /^\.(jpe?g|png|pdf|docx?|pptx?|mp4|webm|mov|mp3|m4a|wav|ogg)$/.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new AppError(400, 'Unsupported attachment format. Choose a PDF, JPG, PNG, Word, PowerPoint, video or audio file.'))
  },
})
