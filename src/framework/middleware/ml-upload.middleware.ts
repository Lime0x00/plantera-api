import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

interface ServiceError extends Error {
  statusCode: number;
}

function isServiceError(err: unknown): err is ServiceError {
  return (
    err instanceof Error &&
    'statusCode' in err &&
    typeof (err as ServiceError).statusCode === 'number'
  );
}

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('INVALID_FILE_TYPE'), { statusCode: 400 }));
    }
  },
});

function validateImageOrUrl(req: Request, res: Response, next: NextFunction) {
  if (req.file) {
    if (req.file.size === 0) {
      return res.status(422).json({
        success: false,
        errorCode: 'EMPTY_IMAGE_FILE',
        message: 'Uploaded image file is empty.',
        error: 'Unprocessable Entity',
        details: {},
      });
    }
    return next();
  }

  if (req.body?.imageUrl && typeof req.body.imageUrl === 'string') {
    req.body.imageUrl = req.body.imageUrl.trim();
    return next();
  }

  return res.status(422).json({
    success: false,
    errorCode: 'MISSING_IMAGE_FIELD',
    message: 'Either an image file or an imageUrl is required.',
    error: 'Unprocessable Entity',
    details: {},
  });
}

function handleMulterError(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_PARAMETER_TYPE',
        message: 'Image file size exceeds the 10 MB limit.',
        error: 'Bad Request',
        details: {},
      });
    }
  }

  if (isServiceError(err) && err.statusCode === 400) {
    return res.status(400).json({
      success: false,
      errorCode: 'INVALID_FILE_TYPE',
      message: 'Uploaded file must be an image.',
      error: 'Bad Request',
      details: {},
    });
  }

  next(err);
}

export const mlUpload = [
  multerUpload.single('image'),
  validateImageOrUrl,
  handleMulterError,
];
