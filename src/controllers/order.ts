import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/order.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import { myCache } from "../app.js";
import ErrorHandler from "../utils/utility-class.js";

// Middleware to get a user's orders
export const myOrder = TryCatch(
  async (
    req: Request<{}, {}, NewOrderRequestBody>,
    res,
    next: NextFunction
  ) => {
    const { id: user } = req.query;
    const key = `my-orders-${user}`;

    // Check if the orders are cached
    let orders: any = [];
    if (myCache.has(key)) {
      orders = JSON.parse(myCache.get(key)!);
    } else {
      // Retrieve orders from the database if not in cache
      orders = await Order.find({ user });
      myCache.set(key, JSON.stringify(orders));
    }

    res.status(200).json({
      success: true,
      orders,
    });
  }
);

// Middleware to get all orders
export const allOrder = TryCatch(
  async (
    req: Request<{}, {}, NewOrderRequestBody>,
    res,
    next: NextFunction
  ) => {
    const key = `all-orders`;

    // Check if all orders are cached
    let orders: any = [];
    if (myCache.has(key)) {
      orders = JSON.parse(myCache.get(key)!);
    } else {
      // Retrieve all orders from the database if not in cache
      orders = await Order.find().populate("user", "name");
      myCache.set(key, JSON.stringify(orders));
    }

    res.status(201).json({
      success: true,
      orders,
    });
  }
);

// Middleware to get a single order by ID
export const getSingleOrder = TryCatch(async (req, res, next: NextFunction) => {
  const { id } = req.params;
  const key = `order-${id}`;

  let order;

  // Check if the single order is cached
  if (myCache.has(key)) {
    order = JSON.parse(myCache.get(key)!);
  } else {
    // Retrieve the single order from the database if not in cache
    order = await Order.findById(id).populate("user", "name");
    if (!order) return next(new ErrorHandler("Order not found", 404));
    myCache.set(key, JSON.stringify(order));
  }

  res.status(201).json({
    success: true,
    order,
  });
});

// Middleware to create a new order
export const newOrder = TryCatch(
  async (
    req: Request<{}, {}, NewOrderRequestBody>,
    res,
    next: NextFunction
  ) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    } = req.body;

    // Check if required fields are present
    if (
      !shippingInfo ||
      !orderItems ||
      !user ||
      !subtotal ||
      !tax ||
      !shippingCharges ||
      !discount ||
      !total
    )
      return next(new ErrorHandler("Please fill all the fields", 404));

    // Create a new order in the database
    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    });

    // Update stock based on the new order
    await reduceStock(orderItems);

    // Invalidate cache related to products, orders, and admin
    invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId: order.orderItems.map((i) => String(i.productId)),
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
    });
  }
);

// Middleware to process an order (update order status)
export const processOrder = TryCatch(async (req, res, next: NextFunction) => {
  const { id } = req.params;

  // Find the order by its ID
  const order = await Order.findById(id);

  // Check if the order exists
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }
  console.log("Before switch:", order.status);
  // Update the order status based on its current status
  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }
  console.log("After switch:", order.status);
  // Save the updated order status
  await order.save();

  // Invalidate cache related to products, orders, and admin
  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  // Respond with a success message
  res.status(201).json({
    success: true,
    message: "Order Processed successfully",
  });
});

//Delete Order
export const deleteOrder = TryCatch(async (req, res, next: NextFunction) => {
  const { id } = req.params;

  // Find the order by its ID
  const order = await Order.findById(id);

  // Check if the order exists
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  await order.deleteOne();
  // Invalidate cache related to products, orders, and admin
  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });

  // Respond with a success message
  res.status(201).json({
    success: true,
    message: "Order Deleted successfully",
  });
});
