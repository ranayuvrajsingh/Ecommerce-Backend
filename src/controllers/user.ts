import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { NewUserRequestBody } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";

export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, photo, _id, gender, dob } = req.body;
    console.log(req.body);

    let user = await User.findOne({ _id });
    if (user)
      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}`,
      });
    if (!_id || !name || !email || !photo || !gender || !dob)
      return next(
        new ErrorHandler("Please provide all the required fields", 400)
      );

    user = await User.create({
      name,
      email,
      photo,
      _id,
      gender,
      dob,
    });
    res.status(201).json({ success: true, message: `Welcome, ${user.name}` });
  }
);

export const getAllUsers = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find({});
    res.status(200).json({ success: true, data: users });
  }
);

export const getUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    res.status(200).json({ success: true, data: user });
  }
);

export const deleteUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return next(new ErrorHandler("User not found", 404));

    res
      .status(200)
      .json({ success: true, message: "User Deleted Successfully" });
    console.log("done deletion");
  }
);
