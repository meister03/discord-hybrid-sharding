import { request } from "https";

import { DefaultOptions, Endpoints } from "../types/shared";

export function generateNonce() {
    return Date.now().toString(36) + Math.random().toString(36);
}

export function chunkArray(array: any[], chunkSize: number) {
    const R = [];
    for (let i = 0; i < array.length; i += chunkSize) R.push(array.slice(i, i + chunkSize));
    return R;
}

export function arraysAreTheSame(firstArray: any[], secondArray: any[]) {
    return firstArray.length === secondArray.length && firstArray.every((element, index) => element === secondArray[index]);
}

export function delayFor(ms: number) {
    if(ms < 0) return;
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export function makePlainError(err: Error) {
    return {
        name: err['name'],
        message: err['message'],
        stack: err['stack'],
    };
}

export function shardIdForGuildId(guildId: string, totalShards = 1) {
    const shard = Number(BigInt(guildId) >> BigInt(22)) % totalShards;
    if (shard < 0)
        throw new Error(
            'SHARD_MISCALCULATION_SHARDID_SMALLER_THAN_0 ' +
                `Calculated Shard: ${shard}, guildId: ${guildId}, totalShards: ${totalShards}`,
        );
    return shard;
}

export async function fetchRecommendedShards(token: string, guildsPerShard = 1000) {
    if (!token) throw new Error('DISCORD_TOKEN_MISSING');

    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bot ${token.replace(/^Bot\s*/i, '')}`,
        },
    };

    return new Promise<number>((resolve, reject) => {
        const req = request(
            `${DefaultOptions.http.api}/v${DefaultOptions.http.version}${Endpoints.botGateway}`,
            options,
            res => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        const responseData = JSON.parse(data);
                        resolve(responseData.shards * (1000 / guildsPerShard));
                    } else if (res.statusCode === 401) {
                        reject(new Error('DISCORD_TOKEN_INVALID'));
                    } else {
                        reject(new Error(`Failed to fetch data. Status code: ${res.statusCode}`));
                    }
                });
            },
        );

        req.on('error', error => {
            reject(error);
        });

        req.end();
    });
}
