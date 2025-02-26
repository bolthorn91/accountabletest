import { Request, Response } from 'express';
import { ReservationService } from '../../application/services/ReservationService';

export class ReservationController {
  constructor(private reservationService: ReservationService) {}

  async getReservations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const bookId = req.query.bookId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      let reservations;
      
      if (userId) {
        reservations = await this.reservationService.getReservationsByUserId(userId, page, limit);
      } else if (bookId) {
        reservations = await this.reservationService.getReservationsByBookId(bookId, page, limit);
      } else {
        res.status(400).json({ error: 'Either userId or bookId is required' });
        return;
      }
      
      res.json({
        data: reservations,
        meta: {
          page,
          limit,
          count: reservations.length
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reservations' });
    }
  }

  async getReservationById(req: Request, res: Response): Promise<void> {
    try {
      const reservation = await this.reservationService.getReservationById(req.params.id);
      
      if (!reservation) {
        res.status(404).json({ error: 'Reservation not found' });
        return;
      }
      
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reservation' });
    }
  }

  async createReservation(req: Request, res: Response): Promise<void> {
    try {
      const { userId, bookId } = req.body;
      
      if (!userId || !bookId) {
        res.status(400).json({ error: 'userId and bookId are required' });
        return;
      }
      
      const reservation = await this.reservationService.createReservation(userId, bookId);
      
      res.status(201).json(reservation);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create reservation' });
    }
  }

  async returnReservation(req: Request, res: Response): Promise<void> {
    try {
      const reservation = await this.reservationService.returnReservation(req.params.id);
      
      if (!reservation) {
        res.status(404).json({ error: 'Reservation not found' });
        return;
      }
      
      res.json(reservation);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to return reservation' });
    }
  }
} 