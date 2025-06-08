const redis = require('redis');

class RedisClient {
    constructor() {
        this.client = null;
        this.connected = false;
        this._connectPromise = null;

        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
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

// Singleton instance
const redisClient = new RedisClient();
// Attempt to connect on startup, but don't block server start if Redis is down initially.
// Operations will attempt to connect/reconnect as needed.
redisClient._ensureConnected().catch(err => {
    console.warn('Initial Redis connection attempt failed. Will retry on demand.', err.message);
});

module.exports = redisClient;
