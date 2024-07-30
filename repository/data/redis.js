const Redis = require('ioredis');
const constants = require('../../utility/constants');
const redis = new Redis({
    host: constants.redis.host,
    port: constants.redis.port,
    password: constants.redis.password
});

function setHashKey(header, key, value) {
    return new Promise((resolve, reject) => {
        redis.hset(header, key, value, function (err, reply) {
            if (err) {
                return reject(err);
            }
            return resolve(reply);
        });
    });
}

function getHashKey(header, key) {
    return new Promise((resolve, reject) => {
        redis.hget(header, key, function (err, reply) {
            if (err) {
                return reject(err);
            }
            return resolve(reply);
        });
    });
}

function hashKeyIncr(header, key, value) {
    return new Promise((resolve, reject) => {
        redis.hincrby(header, key, value, function (err, reply) {
            if (err) {
                return reject(err);
            }
            return resolve(reply);
        });
    });
}

function addToSet(header, key) {
    return new Promise((resolve, reject) => {
        redis.sadd(header, key, function (err, reply) {
            if (err) {
                return reject(err);
            }
            return resolve(reply);
        });
    });
}

function getWholeHash(header) {
    return new Promise((resolve, reject) => {
        redis.hgetall(header, function (err, reply) {
            if (err) {
                return reject(err);
            }
            return resolve(reply);
        });
    });
}

function expireAtKey(header, timestamp) {
    return new Promise((resolve, reject) => {
        redis.expireat(header, timestamp, function (err, reply) {
            if (err) {
                return reject(err);
            }
            return resolve(reply);
        });
    });
}

function setKey(header, value) {
    return new Promise((resolve, reject) => {
        redis.set(header, value, function (err, reply) {
            if (err) {
                return reject(err);
            }
            return resolve(reply);
        });
    });
}

function getKey(header) {
    return new Promise((resolve, reject) => {
        redis.get(header, function (err, reply) {
            if (err) {
                return reject(err);
            }
            return resolve(reply);
        });
    });
}

module.exports = {
    setHashKey, getHashKey, hashKeyIncr, addToSet, getWholeHash, expireAtKey, setKey, getKey
}