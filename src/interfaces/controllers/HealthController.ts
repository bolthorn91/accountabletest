import { Request, Response } from 'express';

export class HealthController {
  async check(req: Request, res: Response): Promise<void> {
    res.json({
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime()
    });
  }
} 