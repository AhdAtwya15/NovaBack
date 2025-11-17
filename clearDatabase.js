const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const Category = require('./models/categoryModel');
const SubCategory = require('./models/subCategoryModel');
const Brand = require('./models/brandModel');
const Product = require('./models/productModel');
const Order = require('./models/orderModel');

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, { serverSelectionTimeoutMS: 30000 });
    console.log('🚀 DB connected');

    await Product.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    await SubCategory.deleteMany({});
    await Order.deleteMany({});

    console.log('🧹 All Products, Categories, Brands, SubCategories and Orders deleted!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

clearDB();
