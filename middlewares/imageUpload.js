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
exports.uploadSingleImage = (fieldName, folder = 'ecommerce') => 
  async (req, res, next) => {
    const uploadSingle = promisify(upload.single(fieldName));
    try {
      await uploadSingle(req, res);
      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: `ecommerce/${folder}`, transformation: [{ width: 1000, height: 1000, crop: 'limit' }] },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          ).end(req.file.buffer);
        });
        req.body[fieldName] = uploadResult.secure_url;
      }
      next();
    } catch (error) {
      next(new ApiError('Upload failed', 500));
    }
  };

// Multiple images upload + Cloudinary upload
exports.uploadMixOfImages = (fields, folder = 'products') => 
  async (req, res, next) => {
    const uploadFields = promisify(upload.fields(fields));
    try {
      await uploadFields(req, res);
      if (req.files) {
        // Create upload promises for each file with field information
        const uploadPromises = [];
        const fieldInfo = [];

        // Create upload promises for each file with field information
        Object.keys(req.files).forEach((fieldName) => {
          req.files[fieldName].forEach((file) => {
            const promise = new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                { 
                  folder: `ecommerce/${folder}`, 
                  transformation: [{ width: 1000, height: 1000, crop: 'limit' }] 
                },
                (error, uploadResult) => {
                  if (error) reject(error);
                  else resolve({ result: uploadResult, fieldName });
                }
              ).end(file.buffer);
            });
            uploadPromises.push(promise);
            fieldInfo.push({ fieldName });
          });
        });

        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);
        
        // Map results back to their correct fields
        results.forEach(({ result, fieldName }) => {
          // For single image fields like imageCover, set as string
          // For multiple image fields like images, set as array
          const fieldConfig = fields.find(f => f.name === fieldName);
          if (fieldConfig && fieldConfig.maxCount === 1) {
            // Single image field
            req.body[fieldName] = result.secure_url;
          } else {
            // Multiple image field
            if (!req.body[fieldName]) req.body[fieldName] = [];
            req.body[fieldName].push(result.secure_url);
          }
        });
      }
      next();
    } catch (error) {
      next(new ApiError('Upload failed', 500));
    }
  };