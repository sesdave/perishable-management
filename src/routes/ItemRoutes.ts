import { Router } from 'express';
import { validateAddItem, validateAddQuantity } from '../middleware/validators/addItemValidator';
import { addLotHandler, sellItemHandler, getItemQuantityHandler } from '../controller/ItemController';

const router = Router();

router.post('/:item/add', validateAddItem, addLotHandler);
router.post('/:item/sell', validateAddQuantity, sellItemHandler);
router.get('/:item/quantity', getItemQuantityHandler);

export default router;
