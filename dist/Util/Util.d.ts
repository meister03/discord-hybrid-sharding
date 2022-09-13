export declare function generateNonce(): string;
export declare function chunkArray(array: any[], chunkSize: number): any[][];
export declare function delayFor(ms: number): Promise<unknown>;
export declare function makePlainError(err: Error): {
    name: string;
    message: string;
    stack: string | undefined;
};
export declare function shardIdForGuildId(guildId: string, totalShards?: number): number;
export declare function fetchRecommendedShards(token: string, guildsPerShard?: number): Promise<number>;
//# sourceMappingURL=Util.d.ts.map