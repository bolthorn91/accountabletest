import { Request, Response } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
) => {
  console.error(err.stack);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
}; 