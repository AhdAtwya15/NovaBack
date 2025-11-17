// const express = require('express');
// const {
//   getProduct,
//   getProducts,
//   createProduct,
//   updateProduct,
//   deleteProduct,
//   uploadProductImages,
//   resizeProductImages,
// } = require('../controllers/productController');
// const {
//   createProductValidator,
//   getProductValidator,
//   updateProductValidator,
//   deleteProductValidator,
// } = require('../utils/validators/productValidator');

// const authController = require('../controllers/authController');
// const reviewRoute = require('./reviewRoute');

// const router = express.Router();

// // POST  /products/n1b1213ga2/reviews
// // GET   /products/n1b1213ga2/reviews
// // GET   /products/n1b1213ga2/reviews/jjh132hh4
// router.use('/:productId/reviews', reviewRoute);

// router
//   .route('/')
//   .get(getProducts)
//   .post(
//     authController.auth,
//     authController.allowedTo('admin', 'manager'),
//     uploadProductImages,
//     resizeProductImages,
//     createProductValidator,
//     createProduct
//   );

// // router.use(idValidation);
// router
//   .route('/:id')
//   .get(getProductValidator, getProduct)
//   .put(
//     authController.auth,
//     authController.allowedTo('admin', 'manager'),
//     uploadProductImages,
//     resizeProductImages,
//     updateProductValidator,
//     updateProduct
//   )
//   .delete(
//     authController.auth,
//     authController.allowedTo('admin'),
//     deleteProductValidator,
//     deleteProduct
//   );

// module.exports = router;


const express = require('express');
const {
  getProduct,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  processProductImages,        // ← الجديد بدل resizeProductImages
} = require('../controllers/productController');

const {
  createProductValidator,
  getProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require('../utils/validators/productValidator');

const authController = require('../controllers/authController');
const reviewRoute = require('./reviewRoute');

const router = express.Router();

// Nested reviews route
router.use('/:productId/reviews', reviewRoute);

router
  .route('/')
  .get(getProducts)
  .post(
    authController.auth,
    authController.allowedTo('admin', 'manager'),
    uploadProductImages,           // Cloudinary upload
    processProductImages,          // يحول الروابط من Cloudinary للـ req.body
    createProductValidator,
    createProduct
  );

router
  .route('/:id')
  .get(getProductValidator, getProduct)
  .put(
    authController.auth,
    authController.allowedTo('admin', 'manager'),
    uploadProductImages,           // Cloudinary upload
    processProductImages,          // نفس الشغل في الـ update
    updateProductValidator,
    updateProduct
  )
  .delete(
    authController.auth,
    authController.allowedTo('admin'),
    deleteProductValidator,
    deleteProduct
  );

module.exports = router;