"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ClusterManager_1 = require("../Core/ClusterManager");
// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('os');
jest.mock('events');
// Define the test suite
describe('ClusterManager', () => {
    let clusterManager;
    const file = 'testFile.js';
    const options = {
        respawn: true,
        restarts: { max: 3, interval: 60000 * 60, current: 0 },
        clusterData: {},
        totalShards: 1,
        totalClusters: 1,
    };
    beforeEach(() => {
        clusterManager = new ClusterManager_1.ClusterManager(file, options);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    // Test cases
    it('ClusterManager initializes correctly', () => {
        expect(clusterManager.file).toEqual(file);
        expect(clusterManager.respawn).toEqual(options.respawn);
        expect(clusterManager.restarts).toEqual(options.restarts);
        expect(clusterManager.clusterData).toEqual(options.clusterData);
        expect(clusterManager.totalShards).toEqual(options.totalShards);
        expect(clusterManager.totalClusters).toEqual(options.totalClusters);
    });
    it('ClusterManager throws error when invalid options provided', () => {
        expect(() => new ClusterManager_1.ClusterManager('', options)).toThrow();
    });
});
