import { Router } from 'express';
import { ReservationController } from '../controllers/ReservationController';

export const reservationRoutes = (reservationController: ReservationController): Router => {
  const router = Router();

  router.get('/', reservationController.getReservations.bind(reservationController));
  router.get('/:id', reservationController.getReservationById.bind(reservationController));
  router.post('/', reservationController.createReservation.bind(reservationController));
  router.post('/:id/return', reservationController.returnReservation.bind(reservationController));

  return router;
}; 