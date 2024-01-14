import { Op } from 'sequelize';
import { Lot } from '../model';
import { getAsync, setAsync, deleteAsync } from '../util/cache';
import { convertEpochMillisecondsToDatetime } from '../util/util'
import { sequelize } from '../model';
import { throwCustomError } from '../util/error/errorUtil'
import LockService from './LockService'; // Adjust the import path
import redis  from '../config/redisClient'; 

export const addLot = async (item: string, quantity: number, expiry: number) => {
  // Validate input data
  if (!quantity || !expiry) {
    throw new Error('Invalid input data');
  }
  const convertExpiry = convertEpochMillisecondsToDatetime(expiry);
  console.log(`Converted Expiry ${convertExpiry}`)
  // Add the lot to the database
  const lot = await Lot.create({
    item,
    quantity,
    expiry: convertExpiry,
  });


  // Update the cache
  await updateCache(item);
};



export const sellItem = async (item: string, quantity: number) => {
  const lockKey = `SELLING-${item} - LOCK`;
  const lockTimeout = 5000;
  const lockService = new LockService(redis);

  let lock = null;

  try {
    lock = await lockService.acquireLock(lockKey, lockTimeout);

    if (lock) {
        console.log(`Lock acquired - ${lockKey} - ${lock}`)
      // Get the item quantities ordered by expiry date ascending
      const items = await Lot.findAll({
        where: {
          item,
          expiry: { [Op.gt]: new Date() },
        },
        order: [['expiry', 'ASC']], // Order by expiry date ascending
        attributes: ['id', 'quantity', 'expiry'], // Include the 'id' for identification
      });
      console.log(`Items - ${JSON.stringify(items)}`)
      let availableQuantity = 0;
      let totalQuantity = 0;

      // Calculate the total quantity and determine the available quantity
      for (const itemData of items) {
        totalQuantity += itemData.quantity;
        if (totalQuantity >= quantity) {
          availableQuantity = quantity;
          break;
        }
      }

      console.log(`Sell Stuff - ${quantity} - ${availableQuantity}`);

      if (availableQuantity < quantity) {
        throw new Error(`Insufficient quantity available`);
      }

      // Update the quantities and expiries in the database
      let remainingQuantity = quantity;
      for (const itemData of items) {
        const { id, quantity: itemQuantity, expiry } = itemData;
        if (remainingQuantity <= 0) break;

        if (itemQuantity >= remainingQuantity) {
          // This item has enough quantity to cover the remaining required quantity
          await Lot.update(
            { quantity: itemQuantity - remainingQuantity },
            {
              where: {
                id, // Use the 'id' for precise identification
              },
            }
          );
          remainingQuantity = 0;
        } else {
          // This item has some quantity left, but not enough to cover the remaining required quantity
          await Lot.update(
            { quantity: 0 }, // Set quantity to 0 for this item
            {
              where: {
                id, // Use the 'id' for precise identification
              },
            }
          );
          remainingQuantity -= itemQuantity;
        }
      }

      // Update the cache
      await updateCache(item);
    } else {
      throw new Error(`Unable to Sell: ${item}. Please try again!!`);
    }
  } catch (error) {
    console.error(`Sell Error - ${error}`);
    throwCustomError(`${error}`, 400);
  } finally {
    if (lock) {
      try {
        console.log("Lock Released")
        await lockService.releaseLock(lock);
      } catch (error) {
        console.error('Error while releasing lock:', error);
      }
    }
  }
};


export const getItemQuantity = async (item: string) => {
  try {
    const cachedData = await getAsync<{ quantity: number; validTill: number }>(item);

    if (cachedData) {
      return {
        quantity: cachedData.quantity,
        validTill: cachedData.validTill,
      };
    } else {
      const { quantity, expiry } = await getDatabaseItemQuantity(item); // Use getDatabaseItemData to fetch both quantity and expiry

      let validTill: number | null = null; 

      if (quantity > 0 && expiry) {
        validTill = expiry; // Use the expiry value from the database
        await setAsync(item, { quantity, validTill }, Math.ceil((validTill - Date.now()) / 1000));
      }

      return {
        quantity,
        validTill: validTill,  // Use the calculated validTill value or null if no expiry
      };
    }
  } catch (error) {
    console.error('Error fetching quantity:', error);
    return {
      quantity: await getDatabaseItemQuantity(item),
      validTill: null,
    };
  }
};

const updateCache = async (item: string) => {
  try {
    const { quantity, expiry } = await getDatabaseItemQuantity(item);
    console.log(`Retrieved data - ${item}, ${quantity}, ${expiry}`);

    if (expiry && expiry > Date.now()) {
      // If the expiry is valid, update the cache with quantity and validTill
      const validTill = new Date(expiry).getTime(); // Convert expiry to a JavaScript Date object
      const cacheData = { quantity, validTill };
      console.log(`Caching ${JSON.stringify(cacheData)}`);

      // Set the cache data and its expiry to match the item's expiry
      const cacheExpiryInSeconds = Math.ceil((validTill - Date.now()) / 1000);
      await setAsync(item, cacheData, cacheExpiryInSeconds);
    } else {
      // If the item has expired, remove it from the cache
      await deleteAsync(item);
    }
  } catch (error) {
    console.error('Error updating cache:', error);
  }
};


export default updateCache;

const getDatabaseItemQuantity = async (item: string): Promise<{ quantity: number, expiry: number | null }> => {
  try {
    const currentTime = new Date();

    const lot = await Lot.findOne({
      where: {
        item,
        expiry: { [Op.gt]: currentTime },
        quantity: { [Op.gt]: 0 }
      },
      attributes: [
        [sequelize.literal('SUM(quantity)'), 'totalQuantity'],
        [sequelize.literal('MIN(expiry)'), 'expiry']
      ]
    });

    console.log(`Total Lot: ${JSON.stringify(lot)}, item - ${item}`);

    const totalQuantity = lot ? Number(lot.get('totalQuantity')) || 0 : 0;
    const expiry = lot ? (lot.get('expiry') as Date)?.getTime() || null : null;

    console.log(`Total Quantity: ${totalQuantity}, Expiry: ${expiry}`);
    return { quantity: totalQuantity, expiry };
  } catch (error) {
    console.error('Error while fetching item data from the database:', error);
    throw error;
  }
};

