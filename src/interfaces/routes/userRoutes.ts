import { Router } from 'express';
import { UserController } from '../controllers/UserController';

export const userRoutes = (userController: UserController): Router => {
  const router = Router();

  router.get('/', userController.getUsers.bind(userController));
  router.get('/:id', userController.getUserById.bind(userController));
  router.post('/', userController.createUser.bind(userController));
  router.put('/:id', userController.updateUser.bind(userController));
  router.delete('/:id', userController.deleteUser.bind(userController));
  router.post('/:id/wallet', userController.addToWallet.bind(userController));

  return router;
}; 