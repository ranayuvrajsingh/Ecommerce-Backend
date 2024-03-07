import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, "Please enter the Coupon Code"],
    unique: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, "Please enter the Discount"],
  },
});

const Coupon = mongoose.model("Coupon", couponSchema);

export { Coupon };
