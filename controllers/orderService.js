const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ApiError = require('../utils/apiError');
const factory = require('./handlersFactory');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');

// @desc    Create new order
// @route   POST /api/orders/cartId
// @access  Private/Protected/User
exports.createCashOrder = asyncHandler(async (req, res, next) => {
  // app settings
  const taxPrice = 0;
  const shippingPrice = 0;

  // 1) Get logged user cart
  const cart = await Cart.findById(req.params.cartId);
  if (!cart) {
    return next(
      new ApiError(`There is no cart for this user :${req.user._id}`, 404)
    );
  }

  // 2) Check if there is coupon apply
  const cartPrice = cart.totalAfterDiscount
    ? cart.totalAfterDiscount
    : cart.totalCartPrice;

  // 3) Create order with default cash option
  const order = await Order.create({
    user: req.user._id,
    cartItems: cart.products,
    shippingAddress: req.body.shippingAddress,
    totalOrderPrice: taxPrice + shippingPrice + cartPrice,
  });

  // 4) After creating order decrement product quantity, increment sold
  // Performs multiple write operations with controls for order of execution.
  if (order) {
    const bulkOption = cart.products.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.count, sold: +item.count } },
      },
    }));

    await Product.bulkWrite(bulkOption, {});

    // 5) Clear cart
    await Cart.findByIdAndDelete(req.params.cartId);
  }

  res.status(201).json({ status: 'success', data: order });
});

// @desc    Get Specific order
// @route   GET /api/orders/:id
// @access  Private/Protected/User-Admin
exports.getSpecificOrder = factory.getOne(Order);

exports.filterOrdersForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'user') req.filterObject = { user: req.user._id };
  next();
});

// @desc    Get my orders
// @route   GET /api/orders
// @access  Private/Protected/User-Admin
exports.getAllOrders = factory.getAll(Order);

// @desc    Update  order to  paid
// @route   PUT /api/orders/:id/pay
// @access  Private/Protected/User-Admin
exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ApiError(`There is no order for this id: ${req.params.id}`, 404)
    );
  }

  order.isPaid = true;
  order.paidAt = Date.now();

  const updatedOrder = await order.save();
  res.status(200).json({
    status: 'Success',
    data: updatedOrder,
  });
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(
      new ApiError(`There is no order for this id: ${req.params.id}`, 404)
    );
  }

  order.isDelivered = true;
  order.deliveredAt = Date.now();

  const updatedOrder = await order.save();
  res.status(200).json({ status: 'Success', data: updatedOrder });
});

// @desc    Create order checkout session
// @route   GET /api/orders/:cartId
// @access  Private/User
exports.checkoutSession = asyncHandler(async (req, res, next) => {
  // 1) Get the currently cart
  const cart = await Cart.findById(req.params.cartId);
  if (!cart) {
    return next(
      new ApiError(`There is no cart for this user :${req.user._id}`, 404)
    );
  }

  // 2) Get cart price, Check if there is coupon apply
  const cartPrice = cart.totalAfterDiscount
    ? cart.totalAfterDiscount
    : cart.totalCartPrice;

  // Validate cart has items
  if (!cart.products || cart.products.length === 0) {
    return next(
      new ApiError('Cart is empty', 400)
    );
  }

  // 3) Create checkout session
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          name: req.user.name,
          amount: cartPrice * 100,
          currency: 'egp',
          quantity: 1,
        },
      ],
      mode: 'payment',
      // success_url: `${req.protocol}://${req.get('host')}/orders`,
      success_url: `${process.env.FRONTEND_URL}/success`,
      // cancel_url: `${req.protocol}://${req.get('host')}/cart`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
      customer_email: req.user.email,
      client_reference_id: req.params.cartId,
      metadata: req.body.shippingAddress,
    });

    // 4) Create session as response
    res.status(200).json({
      status: 'success',
      session,
    });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    return next(
      new ApiError('Error creating payment session', 500)
    );
  }
});

// const createOrderCheckout = async (session) => {
//   // 1) Get needed data from session
//   const cartId = session.client_reference_id;
//   const checkoutAmount = session.display_items[0].amount / 100;
//   const shippingAddress = session.metadata;

//   // 2) Get Cart and User
//   const cart = await Cart.findById(cartId);
//   const user = await User.findOne({ email: session.customer_email });

//   //3) Create order
//   const order = await Order.create({
//     user: user._id,
//     cartItems: cart.products,
//     shippingAddress,
//     totalOrderPrice: checkoutAmount,
//     paymentMethodType: 'card',
//     isPaid: true,
//     paidAt: Date.now(),
//   });

//   // 4) After creating order decrement product quantity, increment sold
//   // Performs multiple write operations with controls for order of execution.
//   if (order) {
//     const bulkOption = cart.products.map((item) => ({
//       updateOne: {
//         filter: { _id: item.product },
//         update: { $inc: { quantity: -item.count, sold: +item.count } },
//       },
//     }));

//     await Product.bulkWrite(bulkOption, {});

//     // 5) Clear cart
//     await Cart.findByIdAndDelete(cart._id);
//   }
// };


const createOrderCheckout = async (session) => {
  try {
    const cartId = session.client_reference_id;
    const checkoutAmount = session.amount_total / 100; // Convert from cents to dollars
    const shippingAddress = session.metadata;

    console.log('Creating order for cart:', cartId);
    
    const cart = await Cart.findById(cartId);
    if (!cart) {
      console.error('Cart not found for ID:', cartId);
      return;
    }
    
    const user = await User.findOne({ email: session.customer_email });
    if (!user) {
      console.error('User not found for email:', session.customer_email);
      return;
    }

    // Check if an order was recently created (within last 5 minutes) to prevent duplicates
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentOrder = await Order.findOne({
      user: user._id,
      isPaid: true,
      paidAt: { $gte: fiveMinutesAgo }
    });
    
    if (recentOrder) {
      console.log('Recent order already exists for user:', user._id);
      return;
    }

    const order = await Order.create({
      user: user._id,
      cartItems: cart.products,
      shippingAddress,
      totalOrderPrice: checkoutAmount,
      paymentMethodType: 'card',
      isPaid: true,
      paidAt: Date.now(),
    });

    console.log('Order created successfully:', order._id);

    if (order) {
      const bulkOption = cart.products.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { quantity: -item.count, sold: +item.count } },
        },
      }));
      await Product.bulkWrite(bulkOption);
      await Cart.findByIdAndDelete(cartId);
      console.log('Cart cleared and product quantities updated');
    }
  } catch (error) {
    console.error('Error in createOrderCheckout:', error);
    throw error; // Re-throw to be caught by webhook handler
  }
};


// @desc    This webhook will run when stipe payment successfully paid
// @route   PUT /webhook-checkout
// @access  From stripe
// exports.webhookCheckout = (req, res, next) => {
//   const signature = req.headers['stripe-signature'].toString();
//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     return res.status(400).send(`Webhook error: ${err.message}`);
//   }

//   if (event.type === 'checkout.session.completed') {
//     createOrderCheckout(event.data.object);
//   }

//   res.status(200).json({ received: true });
// };

exports.webhookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('⚡ Stripe webhook received:', event.type);

  if (event.type === 'checkout.session.completed') {
    try {
      await createOrderCheckout(event.data.object);
      console.log('✅ Order created successfully for session:', event.data.object.id);
    } catch (error) {
      console.error('❌ Error creating order from webhook:', error);
      return res.status(500).send(`Error creating order: ${error.message}`);
    }
  }

  res.status(200).json({ received: true });
};

// @desc    Verify if order was created after payment
// @route   GET /api/orders/verify/:cartId
// @access  Private/User
exports.verifyOrder = asyncHandler(async (req, res, next) => {
  const { cartId } = req.params;
  
  // Check if order exists for this cart
  const order = await Order.findOne({
    'cartItems._id': cartId,
    user: req.user._id
  });
  
  if (order) {
    res.status(200).json({
      status: 'success',
      orderExists: true,
      order
    });
  } else {
    // Check if cart still exists (payment might have failed)
    const cart = await Cart.findById(cartId);
    
    res.status(200).json({
      status: 'success',
      orderExists: false,
      cartExists: !!cart
    });
  }
});
