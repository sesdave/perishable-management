import chai, { expect, assert  } from 'chai';
import simpleMock from 'simple-mock';
import LockService from '../../src/services/LockService';
import { addLot, sellItem, getItemQuantity } from '../../src/services/ItemService'
import chaiAsPromised from 'chai-as-promised';
import  Lot from '../../src/model/Lot'
import { clearTableData } from '../../src/services/DbCleanupCronservice';

chai.use(chaiAsPromised);

describe('ItemService Test', function(){
  this.timeout(20000);
  let mockRedis: any;
  let lockService: any;
  beforeEach(()=>{
    mockRedis = {
      set: simpleMock.stub(),
      del: simpleMock.stub(),
      get: simpleMock.stub(),
      setEx: simpleMock.stub(),
      flushDb: simpleMock.stub(),
    };
   lockService = new LockService(mockRedis);

    // Mock Lot model methods
    simpleMock.mock(Lot, 'create', async () => {
      return {
        item: 'mockedItem',
        quantity: 1,
        expiry: new Date(),
      };
    });

    simpleMock.mock(Lot, 'findAll', () => {
      // Mock the Lot.findAll method
      return Promise.resolve([
        {
          item: 'mockedItem1',
          quantity: 1,
          expiry: new Date(),
        },
        {
          item: 'mockedItem2',
          quantity: 2,
          expiry: new Date(),
        },
        {
          item: 'foo',
          quantity: 4,
          expiry: new Date(),
        },
      ]);
    });

    simpleMock.mock(Lot, 'update', async () => {
      // Mock the Lot.update method 
      return [1]; // Return the number of rows affected
    });
  });

afterEach(() =>{
  clearTableData()
});


it('acquireLock should return lock key on success', async () => {
    // Set up the mock behavior
    mockRedis.set.returnWith('OK');
    mockRedis.del.returnWith(1)
  
    await lockService.acquireLock('myLockKey', 1000);
    let output = await lockService.releaseLock('myLockKey');
  
    // Assert the result
    expect(output).to.be.true;
  
});

it('getItemQuantity should fetch quantity from cache or database and update the cache', async () => {
  // Set up the mock behavior for redisClient methods
  mockRedis.set.returnWith('OK');
  mockRedis.get.returnWith('{"quantity":3,"validTill":' + (Date.now() + 1000) + '}');
  mockRedis.del.returnWith(1);

  // Mock the Lot.findOne method for the database query
  simpleMock.mock(Lot, 'findOne', async () => {
    return {
      get: (field: string) => {
        if (field === 'totalQuantity') return 2;
        else if (field === 'expiry') return new Date();
        return null;
      },
    };
  });
  await addLot('mockedItem', 3, Date.now() + 1000);

  const result = await getItemQuantity('mockedItem');
  console.log(`Retur Quantity - ${JSON.stringify(result)}`)

  expect(result.quantity).to.equal(3);
});

it('should sell items and update cache after selling', async () => {
  mockRedis.setEx.returnWith('OK');
  mockRedis.get.returnWith('{"quantity":4,"validTill":' + (Date.now() + 1000) + '}');
  mockRedis.del.returnWith(1);
  // Arrange 
  const initialQuantity = 15;
  const soldQuantity = 3;

  // Stub Lot.findOne to return a value for testing
  simpleMock.mock(Lot, 'findOne', async ()=>{
    return{
      get: (field: string) => {
        if (field === 'totalQuantity') {
          return initialQuantity; // Return the initial quantity for testing
        } else if (field === 'expiry') {
          return new Date('2024-1-10').getTime(); // Return a future expiry date
        }
      },
    };
  })

  // Act
  await addLot('foo', initialQuantity, 1706135421892);
  await sellItem('foo', soldQuantity);
  const cachedData = await getItemQuantity('foo');

  // Assert
  chai.expect(cachedData.quantity).to.equal(initialQuantity - soldQuantity);
});

it('throw exception if sell is still on', async () => {
  // Arrange
  const expectedQuantity = 10;
 
  // Act
  await addLot('foo', expectedQuantity, 1706135421892);

  // Concurrent operations to update the quantity
  const promises = [
    async () => {
      await chai.expect(sellItem('foo', 3)).to.be.rejectedWith("Unable to Sell: foo. Please try again!!");
      await new Promise((resolve) => setTimeout(resolve, 6000)); // Delay for 6 seconds
    },
    async () => {
      await chai.expect(sellItem('foo', 2)).to.be.rejectedWith("Unable to Sell: foo. Please try again!!");
      await new Promise((resolve) => setTimeout(resolve, 6000)); // Delay for 6 seconds
    },
    async () => {
      await chai.expect(sellItem('foo', 4)).to.be.rejectedWith("Unable to Sell: foo. Please try again!!");
      await new Promise((resolve) => setTimeout(resolve, 6000)); // Delay for 6 seconds
    },
  ];

  await Promise.all(promises);
});


it('should handle multiple operations and cache updates', async () => {
  // Arrange
  const expectedQuantity = 10;

  // Act
  await addLot('poo', expectedQuantity, 1734135421892);

  // Concurrent operations to update the quantity sequentially with a 5-second delay
  const operations = [
    () => sellItem('poo', 3),
    () => new Promise(resolve => setTimeout(() => resolve(sellItem('poo', 2)), 1000)),
    () => new Promise(resolve => setTimeout(() => resolve(sellItem('poo', 4)), 6000)),
  ];

  for (const operation of operations) {
    await operation();
  }

  // Retrieve updated quantity from cache
  const cachedData = await getItemQuantity('poo');

  // Assert
  chai.expect(cachedData.quantity).to.equal(expectedQuantity - 3 - 2 - 4);
});


it('should not sell more items than available', async () => {
  // Arrange
  const initialQuantity = 5;
  const soldQuantity = 10;

  // Act and Assert
  await addLot('foo', initialQuantity, 1734135421892);
  await chai.expect(sellItem('foo', soldQuantity)).to.be.rejectedWith('Insufficient quantity available');
});

 
});
