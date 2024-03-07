import express from "express";

import { adminOnly } from "../middlewares/auth.js";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProductBySearch,
  getAllProducts,
  getLatestProduct,
  getSingleProduct,
  newProduct,
  updateProduct,
} from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();
// Create New Product    api/v1/product/new
app.post("/new", adminOnly, singleUpload, newProduct);
//to search Products with filters
app.get("/search", getAllProductBySearch);
// To Get Last/Latest 10 product   api/v1/product/latest
app.get("/all", getAllProducts);
app.get("/latest", getLatestProduct);
// to get all Categories of Product   api/v1/product/category
app.get("/category", getAllCategories);
// To Get All Products for Admin    api/v1/product/admin-product
app.get("/admin-product", adminOnly, getAdminProducts);

// To Get update ,And Delete
app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;
