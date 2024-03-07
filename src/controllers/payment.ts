import { myCache, stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";

export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) return next(new ErrorHandler("Amount is required", 400));

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100,
    currency: "INR",
  });

  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

export const newCoupon = TryCatch(async (req, res, next) => {
  const { coupon, amount } = req.body;

  // Check for null or empty coupon value
  if (!coupon || coupon.trim() === "") {
    return next(new ErrorHandler("Invalid coupon value", 400));
  }

  // Check if a coupon with the same code already exists
  const existingCoupon = await Coupon.findOne({ code: coupon });

  if (existingCoupon) {
    return next(new ErrorHandler("Coupon code already exists", 400));
  }

  // Create a new coupon if no duplicates and valid coupon value
  await Coupon.create({ code: coupon, amount });

  return res.status(201).json({
    success: true,
    message: `Coupon ${coupon} Created Successfully`,
  });
});

export const applyDiscount = TryCatch(async (req, res, next) => {
  const { coupon } = req.query;

  const discount = await Coupon.findOne({ code: coupon });
  if (!discount) return next(new ErrorHandler("Coupon does not exist", 400));

  return res.status(200).json({
    success: true,
    discount: discount.amount,
  });
});

export const allCoupons = TryCatch(async (req, res, next) => {
  const cachedCoupons = myCache.get("all-coupons");

  if (cachedCoupons) {
    return res.status(200).json({
      success: true,
      coupons: cachedCoupons,
      message: "Coupons retrieved from cache.",
    });
  }

  const coupons = await Coupon.find({});

  // Cache the result for future requests
  myCache.set("all-coupons", coupons);

  return res.status(200).json({
    success: true,
    coupons,
    message: "Coupons retrieved successfully.",
  });
});

// export const allCoupons = TryCatch(async (req, res, next) => {
//   const coupons = await Coupon.find({});

//   return res.status(200).json({
//     success: true,
//     coupons,
//   });
// });

export const deleteCoupon = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) return next(new ErrorHandler("Coupon does not exist", 400));
  return res.status(200).json({
    success: true,

    message: `Coupon ${coupon?.code} Deleted Successfully.`,
  });
});
