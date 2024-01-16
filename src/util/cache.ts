import  redis  from "../config/redisClient"; 
export const getAsync = async <T>(key: string): Promise<T | null> => {
    try {
      const data = await redis.get(key);
      if (data !== null) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error while getting data from Redis:', error);
      return null;
    }
  };
  
  export const setAsync = async <T>(key: string, value: T, expiresInSeconds: number): Promise<void> => {
    try {
      await redis.setEx(key, expiresInSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Error while setting data in Redis:', error);
    }
  };
  
  export const clearAllCache = async (): Promise<void> => {
    try {
      await redis.flushDb();
    } catch (error) {
      console.error('Error while clearing all cache:', error);
    }
  };
  
  
  
  export const deleteAsync = async (key: string): Promise<boolean> => {
    try {
      const result = await redis.del(key);
      return result === 1;
    } catch (error) {
      console.error('Error deleting key from cache:', error);
      return false; 
    }
  };
  
  
  