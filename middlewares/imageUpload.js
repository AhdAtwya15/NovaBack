const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { promisify } = require('util');
const ApiError = require('../utils/apiError');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new ApiError('Only images allowed', 400), false);
  }
};

// Memory storage for multer (no disk write)
const storage = multer.memoryStorage();

// Basic multer upload (saves to memory)
const upload = multer({ storage, fileFilter: multerFilter });

// Single image upload + Cloudinary upload
exports.uploadSingleImage = (fieldName, folder = 'ecommerce') => {
  return async (req, res, next) => {
    const uploadSingle = promisify(upload.single(fieldName));
    try {
      await uploadSingle(req, res);
      if (req.file) {
        const result = await cloudinary.uploader.upload_stream(
          { folder: `ecommerce/${folder}`, transformation: [{ width: 1000, height: 1000, crop: 'limit' }] },
          (error, result) => {
            if (error) {
              next(new ApiError('Upload error', 500));
            } else {
              req.body[fieldName] = result.secure_url;
              next();
            }
          }
        ).end(req.file.buffer);
      } else {
        next();
      }
    } catch (error) {
      next(new ApiError('Upload failed', 500));
    }
  };
};

// Multiple images upload + Cloudinary upload
exports.uploadMixOfImages = (fields, folder = 'products') => {
  return async (req, res, next) => {
    const uploadFields = promisify(upload.fields(fields));
    try {
      await uploadFields(req, res);
      if (req.files) {
        const uploadPromises = [];
        const fieldNames = Object.keys(req.files);

        fieldNames.forEach((fieldName) => {
          req.files[fieldName].forEach((file) => {
            uploadPromises.push(
              new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                  { 
                    folder: `ecommerce/${folder}`, 
                    transformation: [{ width: 1000, height: 1000, crop: 'limit' }] 
                  },
                  (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                  }
                ).end(file.buffer);
              })
            );
          });
        });

        const results = await Promise.all(uploadPromises);
        results.forEach((result, index) => {
          const fieldName = fieldNames[index % fieldNames.length];
          if (!req.body[fieldName]) req.body[fieldName] = [];
          req.body[fieldName].push(result.secure_url);
        });

        next();
      } else {
        next();
      }
    } catch (error) {
      next(new ApiError('Upload failed', 500));
    }
  };
};