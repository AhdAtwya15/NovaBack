const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// مش محتاجين connection منفصلة تاني، mongoose-sequence بيشتغل مع الـ connection العادي

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'order must belong to user'],
    },
    cartItems: [
      {
        product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
        count: { type: Number, default: 1 },
        color: String,
        price: Number,
      },
    ],
    shippingAddress: {
      details: String,
      phone: String,
      city: String,
      postalCode: String,
    },
    taxPrice: {
      type: Number,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      default: 0.0,
    },
    totalOrderPrice: {
      type: Number,
      default: 0.0,
    },
    paymentMethodType: {
      type: String,
      enum: ['card', 'cash'],
      default: 'cash',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Populate middleware
orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name profileImg email phone',
  }).populate({
    path: 'cartItems.product',
    select: 'title imageCover ratingsAverage ratingsQuantity',
  });
  next();
});

// هنا اللي بدل الـ auto-increment القديم
orderSchema.plugin(AutoIncrement, {
  inc_field: 'id',        // الـ field اللي هيزيد تلقائي
  id: 'order_nums',       // اسم العداد (ممكن تختاري أي اسم، بس يكون مميز)
  start_seq: 1,           // يبدأ من 1
  increment_by: 1
});

module.exports = mongoose.model('Order', orderSchema);