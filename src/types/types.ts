import { NextFunction, Request, Response } from "express";

export interface NewUserRequestBody {
  name: string;
  email: string;
  _id: string;
  photo: string;
  gender: string;
  dob: Date;
}

export interface NewProductRequestBody {
  name: string;
  category: string;
  price: number;
  stock: number;
}

export interface ControllerType {
  (req: Request, res: Response, next: NextFunction): Promise<void | Response<
    any,
    Record<string, any>
  >>;
}

export type SearchRequestQuery = {
  name?: string;
  category?: string;
  price?: string;
  stock?: string;
  page?: string;
  limit?: string;
  sort?: string;
  select?: string;
  populate?: string;
  search?: string;
  searchBy?: string;
  searchValue?: string;
  searchFields?: string;
  searchOperator?: string;
};

export interface BaseQuery {
  name?: { $regex: string; $options: string };
  category?: string;
  price?: { $lte: number };
  stock?: { $lte: number };
}

export type InvalidateCacheProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  userId?: string;
  orderId?: string;
  productId?: string | string[];
};
export type OrderItemType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
};

export type ShippingInfoType = {
  address: string;
  city: string;
  pinCode: number;
  country: string;
  state: string;
};
export interface NewOrderRequestBody {
  shippingInfo: ShippingInfoType;
  tax: number;
  user: string;
  shippingCharges: number;
  subtotal: number;
  total: number;
  discount: number;
  orderItems: OrderItemType[];
}
