const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
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

// Single image upload
exports.uploadSingleImage = (fieldName, folder = 'ecommerce') => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `ecommerce/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' }
      ]
    },
  });

  return multer({ storage, fileFilter: multerFilter }).single(fieldName);
};

// Multiple images upload
exports.uploadMixOfImages = (fields, folder = 'products') => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `ecommerce/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' }
      ]
    },
  });

  return multer({ storage, fileFilter: multerFilter }).fields(fields);
};