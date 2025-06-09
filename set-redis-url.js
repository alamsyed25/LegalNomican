// This is a temporary script to set the Redis URL environment variable
process.env.REDIS_URL = 'redis://default:npxXeXY7LOHR812RidRPWH7nPjaLFbKt@redis-11012.c329.us-east4-1.gce.redns.redis-cloud.com:11012';

// Load the rest of the application
require('./server.js');
