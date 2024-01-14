//const  { redis } = require('../config/redisClient'); 

class LockService {
  private redis: any
  constructor(redisClient: any) {
    this.redis = redisClient;
  }

   async acquireLock(lockKey: string, lockTimeout: number): Promise<string | null> {
    try {
      const lockValue = Date.now() + lockTimeout + 1; 
      const result = await this.redis.set(lockKey, lockValue);
      
      if (result === 'OK') {
        // Lock acquired successfully
        return lockKey;
      }

      // Lock is already held by someone else
      return null;
    } catch (error) {
      console.error('Error while acquiring lock:', error);
      return null;
    }
  }

   async releaseLock(lockKey: string): Promise<boolean> {
    try {
      const result = await this.redis.del(lockKey);
      return result === 1;
    } catch (error) {
      console.error('Error while releasing lock:', error);
      return false;
    }
  }
}

export default LockService;
