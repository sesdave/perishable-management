import { createClient } from 'redis';

const redis = createClient({
  url: "redis://localhost:6379"
});


redis.connect().then(() => {
  console.log('Connected to Redis');
}).catch((error) => {
  console.error('Error connecting to Redis:', error);
});

export default redis;


