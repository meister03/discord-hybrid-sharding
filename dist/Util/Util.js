"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNonce = generateNonce;
exports.chunkArray = chunkArray;
exports.arraysAreTheSame = arraysAreTheSame;
exports.delayFor = delayFor;
exports.makePlainError = makePlainError;
exports.shardIdForGuildId = shardIdForGuildId;
exports.fetchRecommendedShards = fetchRecommendedShards;
const https_1 = require("https");
const shared_1 = require("../types/shared");
function generateNonce() {
    return Date.now().toString(36) + Math.random().toString(36);
}
function chunkArray(array, chunkSize) {
    const R = [];
    for (let i = 0; i < array.length; i += chunkSize)
        R.push(array.slice(i, i + chunkSize));
    return R;
}
function arraysAreTheSame(firstArray, secondArray) {
    return firstArray.length === secondArray.length && firstArray.every((element, index) => element === secondArray[index]);
}
function delayFor(ms) {
    if (ms < 0)
        return;
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
function makePlainError(err) {
    return {
        name: err['name'],
        message: err['message'],
        stack: err['stack'],
    };
}
function shardIdForGuildId(guildId, totalShards = 1) {
    const shard = Number(BigInt(guildId) >> BigInt(22)) % totalShards;
    if (shard < 0)
        throw new Error('SHARD_MISCALCULATION_SHARDID_SMALLER_THAN_0 ' +
            `Calculated Shard: ${shard}, guildId: ${guildId}, totalShards: ${totalShards}`);
    return shard;
}
async function fetchRecommendedShards(token, guildsPerShard = 1000) {
    if (!token)
        throw new Error('DISCORD_TOKEN_MISSING');
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bot ${token.replace(/^Bot\s*/i, '')}`,
        },
    };
    return new Promise((resolve, reject) => {
        const req = (0, https_1.request)(`${shared_1.DefaultOptions.http.api}/v${shared_1.DefaultOptions.http.version}${shared_1.Endpoints.botGateway}`, options, res => {
            let data = '';
            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const responseData = JSON.parse(data);
                    resolve(responseData.shards * (1000 / guildsPerShard));
                }
                else if (res.statusCode === 401) {
                    reject(new Error('DISCORD_TOKEN_INVALID'));
                }
                else {
                    reject(new Error(`Failed to fetch data. Status code: ${res.statusCode}`));
                }
            });
        });
        req.on('error', error => {
            reject(error);
        });
        req.end();
    });
}
