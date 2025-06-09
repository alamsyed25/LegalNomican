/**
 * Redis Connection Test Script
 * 
 * This script tests the connection to the Redis server using the configuration
 * from your .env file.
 */

// Load environment variables directly
require('dotenv').config();

// Import the redis library directly
const redis = require('redis');

// Get the Redis URL from environment variables
const redisUrl = process.env.REDIS_URL;
console.log(`Using Redis URL: ${redisUrl}`);

// Create a Redis client directly with the URL
const client = redis.createClient({
  url: redisUrl
});

// Set up event handlers
client.on('error', (error) => {
  console.error('Redis Client Error:', error);
});

client.on('connect', () => {
  console.log('Redis client is connecting...');
});

client.on('ready', () => {
  console.log('Redis client connected and ready.');
});

// Test function to verify Redis connection
async function testRedisConnection() {
  try {
    console.log('Testing Redis connection...');
    
    // Connect to Redis
    await client.connect();
    
    // Try to set a test value
    const testKey = 'test:connection';
    const testValue = JSON.stringify({ timestamp: Date.now(), message: 'Redis connection test' });
    
    await client.set(testKey, testValue, { EX: 60 }); // Expires in 60 seconds
    console.log('✅ Successfully wrote test data to Redis');
    
    // Try to retrieve the value
    const retrievedValue = await client.get(testKey);
    console.log('✅ Successfully retrieved test data from Redis:');
    console.log(JSON.parse(retrievedValue));
    
    // Delete the test key
    await client.del(testKey);
    console.log('✅ Successfully deleted test data from Redis');
    
    console.log('\n🟢 Redis connection test PASSED! Your application can connect to Redis.');
    
    // Clean up
    await client.quit();
    process.exit(0);
  } catch (error) {
    console.error('\n🔴 Redis connection test FAILED!');
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the test
testRedisConnection();
