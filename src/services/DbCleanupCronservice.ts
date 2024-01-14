import { Lot } from '../model';
import { Op } from 'sequelize';
import cron from 'node-cron';

export const dbCleanup = async () => {
  try {
    const currentTime = new Date();

    // Delete expired lots from the database
    await Lot.destroy({
      where: {
        expiry: {
          [Op.lt]: currentTime, 
        },
      },
    });

    console.log('Database cleanup task executed successfully.');
  } catch (error) {
    console.error('An error occurred during database cleanup:', error);
  }
};

export const clearTableData = async () => {
  try {
    const currentTime = new Date();

    await Lot.truncate();

  } catch (error) {
    console.error('An error occurred during database cleanup:', error);
  }
};

// Schedule the cleanup task to run daily at midnight
cron.schedule('0 0 * * *', dbCleanup);
