const factory = require('./handlersFactory');
const { uploadMixOfImages } = require('../middlewares/imageUpload');
const Product = require('../models/productModel');

// Upload product images (cover + gallery)
exports.uploadProductImages = uploadMixOfImages([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 5 }
], 'products');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = factory.getAll(Product, 'Products');

// @desc    Get specific product by id
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = factory.getOne(Product, 'reviews');

// @desc    Create product
// @route   POST /api/v1/products
// @access  Private (Admin/Manager)
exports.createProduct = factory.createOne(Product);

// @desc    Update product
// @route   PATCH /api/v1/products/:id
// @access  Private (Admin/Manager)
exports.updateProduct = factory.updateOne(Product);

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private (Admin)
exports.deleteProduct = factory.deleteOne(Product);