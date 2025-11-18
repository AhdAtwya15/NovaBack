const express = require('express');
const {
  getProduct,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
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
    uploadProductImages,           // Cloudinary upload (already puts URLs in req.body)
    createProductValidator,
    createProduct
  );

router
  .route('/:id')
  .get(getProductValidator, getProduct)
  .put(
    authController.auth,
    authController.allowedTo('admin', 'manager'),
    uploadProductImages,           // Cloudinary upload (already puts URLs in req.body)
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