import { Response } from "express";

type meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
  meta?: meta;
};

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  res.status(data?.statusCode).json({
    success: data.success,
    message: data.message,
    data: data?.data,
    meta: data?.meta,
  });
};

export default sendResponse;
