// 

const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactory');
const { uploadSingleImage } = require('../middlewares/imageUpload');
const Category = require('../models/categoryModel');

// Upload single image for category
exports.uploadCategoryImage = uploadSingleImage('image', 'categories');

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = factory.getAll(Category);

// @desc    Get specific category by id
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategory = factory.getOne(Category);

// @desc    Create category
// @route   POST /api/v1/categories
// @access  Private (Admin/Manager)
exports.createCategory = factory.createOne(Category);

// @desc    Update category
// @route   PATCH /api/v1/categories/:id
// @access  Private (Admin/Manager)
exports.updateCategory = factory.updateOne(Category);

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private (Admin)
exports.deleteCategory = factory.deleteOne(Category);

exports.deleteAll = factory.deleteAll(Category);