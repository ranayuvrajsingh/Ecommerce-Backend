import { NextFunction, Request, Response } from "express";
import { rm } from "fs";
import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types.js";
import { invalidateCache } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";

// import { faker } from "@faker-js/faker";

//------------------------------Get Requests
// Revalidate on new Update or Delete Product & new Order
//Get All Latest Products
export const getLatestProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    let products;
    if (myCache.has("latestProducts")) {
      products = JSON.parse(myCache.get("latestProducts")!);
    } else {
      products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
      myCache.set("latestProducts", JSON.stringify(products));
    }

    res.status(201).json({
      success: true,
      products,
    });
  }
);
// Revalidate on new Update or Delete Product & new Order
//Get All Categories
export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;
  if (myCache.has("categories")) {
    categories = JSON.parse(myCache.get("categories")!);
  } else {
    categories = await Product.distinct("category");

    myCache.set("categories", JSON.stringify(categories));
  }

  categories = await Product.distinct("category");

  res.status(201).json({
    success: true,
    categories,
  });
});
// Revalidate on new Update or Delete Product & new Order
//Get Admin Products Authenticated By Admin Only
export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;
  if (myCache.has("all-products"))
    products = JSON.parse(myCache.get("all-products")!);
  else {
    products = await Product.find({});
    myCache.set("all-products", JSON.stringify(products));
  }

  products = await Product.find({});

  res.status(201).json({
    success: true,
    products,
  });
});
// Get Single Product Details
export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  const id = req.params.id;
  if (myCache.has(`product-${id}`))
    product = JSON.parse(myCache.get(`product-${id}`)!);
  else {
    product = await Product.findById(id);
    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  product = await Product.findById(id);

  if (!product) return next(new ErrorHandler(" Product Not Found ", 404));
  res.status(201).json({
    success: true,
    product,
  });
});

//Search
export const getAllProductBySearch = TryCatch(
  async (
    req: Request<{}, {}, {}, SearchRequestQuery>,
    res: Response,
    next: NextFunction
  ) => {
    const { search, sort, price, category, stock } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE || 8);
    const skip = (page - 1) * limit;
    const baseQuery: BaseQuery = {};
    //   name: ,
    //   stock: { $lte: stock },
    //   price: { $lte: price },
    //   category: { $regex: category, $options: "i" },
    // };
    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    if (stock) baseQuery.stock = { $lte: Number(stock) };
    if (price) baseQuery.price = { $lte: Number(price) };
    if (category) baseQuery.category = category;
    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, onlyFilteredProducts] = await Promise.all([
      productsPromise,
      Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(onlyFilteredProducts.length / limit);
    res.status(201).json({
      success: true,
      products,
      totalPage,
    });
  }
);

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;
    // 1,2,3,4,5,6,7,8
    // 9,10,11,12,13,14,15,16
    // 17,18,19,20,21,22,23,24
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredOnlyProduct] = await Promise.all([
      productsPromise,
      Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

//---------------------------------------------------------------
//Create New Product
export const newProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, category, price, stock } = req.body;

    const photo = req.file;

    if (!photo) return next(new ErrorHandler("  Please Upload Photo ", 400));
    if (!name || !category || !price || !stock) {
      rm(photo.path, () => {
        console.log("Photo Deleted");
      });
      return next(new ErrorHandler("  Please Enter All Fields ", 400));
    }

    await Product.create({
      name,
      category: category.toLowerCase(),
      price,
      stock,
      photo: photo?.path,
    });
    invalidateCache({ product: true, admin: true });

    res.status(201).json({
      success: true,
      message: "Product Created Successfully",
    });
  }
);

// Update Product Details

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const { name, category, price, stock } = req.body;

  const photo = req.file;

  const product = await Product.findById(id);
  if (!product)
    return next(new ErrorHandler("  Invalid Id Product Not Found ", 404));

  if (photo) {
    rm(product.photo!, () => {
      console.log("Old Photo Deleted");
    });
    product.photo = photo.path;
  }
  if (name) product.name = name;
  if (category) product.category = category;
  if (price) product.price = price;
  if (stock) product.stock = stock;

  await product.save();
  invalidateCache({
    product: true,
    admin: true,
    productId: String(product._id),
  });

  res.status(200).json({
    success: true,
    message: "Product Updated Successfully",
  });
});

//Delete Products
export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) return next(new ErrorHandler(" Product Not Found ", 404));

  invalidateCache({
    product: true,
    admin: true,
    productId: String(product._id),
  });

  rm(product.photo!, () => {
    console.log("Photo Deleted");
  });

  res.status(201).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

// const deleteRandomProducts = async (count: number) => {
//   const products = await Product.find({}).skip(2);
//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log("Products Deleted");
// };
// deleteRandomProducts(10);

// const generateRandomProducts = async (count: number) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       category: faker.commerce.department(),
//       price: faker.commerce.price({ min: 1500, max: 200000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       photo: "uploads\\582c37d0-26cb-4cbf-b918-a336b12797e6.png",
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.past()),
//       __v: 0,
//     };

//     products.push(product);
//   }
//   await Product.insertMany(products);

//   console.log("Products Generated");
// };
// generateRandomProducts(30);
