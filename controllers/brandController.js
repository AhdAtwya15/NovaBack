// 

const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactory');
const { uploadSingleImage } = require('../middlewares/imageUpload');
const Brand = require('../models/brandModel');

// Upload single image for brand
exports.uploadBrandImage = uploadSingleImage('image', 'brands');

// @desc    Get all brands
// @route   GET /api/v1/brands
// @access  Public
exports.getBrands = factory.getAll(Brand);

// @desc    Get specific brand by id
// @route   GET /api/v1/brands/:id
// @access  Public
exports.getBrand = factory.getOne(Brand);

// @desc    Create brand
// @route   POST /api/v1/brands
// @access  Private (Admin/Manager)
exports.createBrand = factory.createOne(Brand);

// @desc    Update brand
// @route   PATCH /api/v1/brands/:id
// @access  Private (Admin/Manager)
exports.updateBrand = factory.updateOne(Brand);

// @desc    Delete brand
// @route   DELETE /api/v1/brands/:id
// @access  Private (Admin)
exports.deleteBrand = factory.deleteOne(Brand);

exports.deleteAll = factory.deleteAll(Brand);