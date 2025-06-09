const redis = require('redis');

/**
 * Mock Redis Client for development when Redis is not available
 */
class MockRedisClient {
    constructor() {
        console.log('Using Mock Redis Client for development');
        this.store = new Map();
        this.connected = true;
    }

    async _ensureConnected() {
        return true;
    }

    async get(key) {
        console.log(`[MockRedis] GET ${key}`);
        return this.store.get(key) || null;
    }

    async set(key, value, options = {}) {
        console.log(`[MockRedis] SET ${key}`);
        this.store.set(key, value);
        
        // Handle expiration if provided
        if (options.EX) {
            setTimeout(() => {
                this.store.delete(key);
            }, options.EX * 1000);
        }
        return 'OK';
    }

    async del(key) {
        console.log(`[MockRedis] DEL ${key}`);
        return this.store.delete(key) ? 1 : 0;
    }

    async expire(key, seconds) {
        console.log(`[MockRedis] EXPIRE ${key} ${seconds}`);
        if (!this.store.has(key)) return 0;
        
        setTimeout(() => {
            this.store.delete(key);
        }, seconds * 1000);
        
        return 1;
    }

    async disconnect() {
        console.log('[MockRedis] Disconnected');
        this.store.clear();
        return true;
    }
}

class RedisClient {
    constructor() {
        this.client = null;
        this.connected = false;
        this._connectPromise = null;

        const redisUrl = process.env.REDIS_URL || 'redis://default:npxXeXY7LOHR812RidRPWH7nPjaLFbKt@redis-11012.c329.us-east4-1.gce.redns.redis-cloud.com:11012';
        console.log(`Initializing Redis client for URL: ${redisUrl}`);

        this.client = redis.createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('Redis: Too many retries. Connection terminated.');
                        return new Error('Too many retries on Redis connection');
                    }
                    // Exponential backoff
                    return Math.min(retries * 100, 3000); 
                }
            }
        });

        this.client.on('error', (error) => {
            console.error('Redis Client Error:', error);
            this.connected = false; 
        });

        this.client.on('connect', () => {
            console.log('Redis client is connecting...');
        });

        this.client.on('ready', () => {
            console.log('Redis client connected and ready.');
            this.connected = true;
        });

        this.client.on('end', () => {
            console.log('Redis client connection ended.');
            this.connected = false;
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('SIGINT received. Disconnecting Redis client...');
            await this.disconnect();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received. Disconnecting Redis client...');
            await this.disconnect();
            process.exit(0);
        });
    }

    async _ensureConnected() {
        if (this.connected && this.client && this.client.isOpen) {
            return;
        }
        if (!this.client) {
            throw new Error('Redis client not initialized.');
        }
        if (this._connectPromise) {
            return this._connectPromise;
        }
        if (!this.client.isOpen) {
            console.log('Redis client is not open. Attempting to connect...');
            this._connectPromise = this.client.connect()
                .then(() => {
                    this.connected = true;
                    this._connectPromise = null;
                    console.log('Redis client reconnected successfully.');
                })
                .catch(err => {
                    this.connected = false;
                    this._connectPromise = null;
                    console.error('Redis client failed to reconnect:', err);
                    throw err; // Re-throw to indicate connection failure
                });
            return this._connectPromise;
        }
    }

    async get(key) {
        await this._ensureConnected();
        try {
            const value = await this.client.get(key);
            if (value === null) return null;
            try {
                return JSON.parse(value); // Attempt to parse if it's JSON
            } catch (e) {
                return value; // Return as string if not JSON
            }
        } catch (error) {
            console.error(`Redis GET error for key ${key}:`, error);
            throw error;
        }
    }

    async set(key, value, options) {
        await this._ensureConnected();
        try {
            const valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value);
            if (options && options.EX) { // Example: { EX: 3600 } for 1 hour expiry
                await this.client.set(key, valueToStore, { EX: options.EX });
            } else {
                await this.client.set(key, valueToStore);
            }
            return true;
        } catch (error) {
            console.error(`Redis SET error for key ${key}:`, error);
            throw error;
        }
    }

    async del(key) {
        await this._ensureConnected();
        try {
            const result = await this.client.del(key);
            return result > 0; // DEL returns the number of keys deleted
        } catch (error) {
            console.error(`Redis DEL error for key ${key}:`, error);
            throw error;
        }
    }

    async expire(key, seconds) {
        await this._ensureConnected();
        try {
            const result = await this.client.expire(key, seconds);
            return result === 1; // EXPIRE returns 1 if timeout was set, 0 if key does not exist
        } catch (error) {
            console.error(`Redis EXPIRE error for key ${key}:`, error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client && this.client.isOpen) {
            try {
                await this.client.quit();
                console.log('Redis client disconnected gracefully.');
            } catch (error) {
                console.error('Error disconnecting Redis client:', error);
            }
        }
        this.connected = false;
    }

    getClient() {
      return this.client;
    }
}

/**
 * Create the appropriate Redis client based on environment and availability
 * @returns {RedisClient|MockRedisClient} - Redis client instance
 */
const createRedisClient = () => {
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const redisUrl = process.env.REDIS_URL;
    
    // In development, if REDIS_URL is not provided, use the mock client
    if (isDev && !redisUrl) {
        console.log('Redis URL not provided in development. Using mock Redis client.');
        return new MockRedisClient();
    }
    
    // Create a real Redis client
    const client = new RedisClient();
    
    // Attempt to connect on startup, but don't block server start if Redis is down initially.
    client._ensureConnected().catch(err => {
        console.warn('Initial Redis connection attempt failed.', err.message);
        
        // In development, fall back to mock client if connection fails
        if (isDev) {
            console.log('Falling back to mock Redis client in development.');
            return new MockRedisClient();
        }
    });
    
    return client;
};

// Create the appropriate Redis client
const redisClient = createRedisClient();

module.exports = redisClient;
