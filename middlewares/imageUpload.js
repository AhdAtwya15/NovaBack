// const multer = require('multer');

// const ApiError = require('../utils/apiError');

// // Upload single image => method return multer middleware
// exports.uploadSingleImage = (fieldName) => {
//   // Storage
//   const multerStorage = multer.memoryStorage();

//   // Accept only images
//   const multerFilter = (req, file, cb) => {
//     if (file.mimetype.startsWith('image')) {
//       cb(null, true);
//     } else {
//       cb(new ApiError('only images allowed', 400), false);
//     }
//   };

//   const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

//   return upload.single(fieldName);
// };


const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const ApiError = require('../utils/apiError');

// تكوين Cloudinary (بياخد المتغيرات من Vercel env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// إعداد Cloudinary Storage لـ multer
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // تحديد المجلد حسب نوع الصورة (categories / products / brands)
    let folder = 'ecommerce/others';
    if (file.fieldname.includes('imageCover')) folder = 'ecommerce/products';
    else if (file.fieldname.includes('images')) folder = 'ecommerce/products';
    else if (req.baseUrl.includes('categories')) folder = 'ecommerce/categories';
    else if (req.baseUrl.includes('brands')) folder = 'ecommerce/brands';

    return {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      public_id: `${file.fieldname}-${Date.now()}`,
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    };
  },
});

// فلتر للصور فقط
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError('Only images are allowed', 400), false);
  }
};

const upload = multer({
  storage: cloudinaryStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// تصدير الـ middleware
exports.uploadSingleImage = (fieldName) => upload.single(fieldName);

// تصدير للصور المتعددة (لو عندك products.images)
exports.uploadMixOfImages = (arrayOfFields) => upload.fields(arrayOfFields);