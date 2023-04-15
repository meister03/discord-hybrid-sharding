"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ClusterManager_1 = require("../ClusterManager");
const Cluster_1 = require("../Cluster");
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
        clusterOptions: {},
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
    test('ClusterManager initializes correctly', () => {
        expect(clusterManager.file).toEqual(file);
        expect(clusterManager.respawn).toEqual(options.respawn);
        expect(clusterManager.restarts).toEqual(options.restarts);
        expect(clusterManager.clusterData).toEqual(options.clusterData);
        expect(clusterManager.clusterOptions).toEqual(options.clusterOptions);
        expect(clusterManager.totalShards).toEqual(options.totalShards);
        expect(clusterManager.totalClusters).toEqual(options.totalClusters);
    });
    test('ClusterManager throws error when invalid options provided', () => {
        expect(() => new ClusterManager_1.ClusterManager('', options)).toThrow();
        expect(() => new ClusterManager_1.ClusterManager(file, { ...options, totalShards: 'invalid' })).toThrow();
        expect(() => new ClusterManager_1.ClusterManager(file, { ...options, totalClusters: 'invalid' })).toThrow();
        expect(() => new ClusterManager_1.ClusterManager(file, { ...options, shardsPerClusters: 'invalid' })).toThrow();
    });
    test('ClusterManager spawns clusters correctly', () => {
        const clusterSpy = jest.spyOn(Cluster_1.Cluster.prototype, 'spawn');
        clusterManager.spawn();
        expect(clusterSpy).toHaveBeenCalledTimes(options.totalClusters);
        expect(clusterSpy).toHaveBeenCalledWith(0, options.totalShards, clusterManager);
    });
    test('ClusterManager sends IPC message correctly', () => {
        const clusterSpy = jest.spyOn(Cluster_1.Cluster.prototype, 'send');
        const message = { data: 'test' };
        clusterManager.send(0, message);
        expect(clusterSpy).toHaveBeenCalledTimes(1);
        expect(clusterSpy).toHaveBeenCalledWith(message);
    });
    test('ClusterManager broadcasts IPC message correctly', () => {
        const clusterSpy = jest.spyOn(Cluster_1.Cluster.prototype, 'broadcast');
        const message = { data: 'test' };
        clusterManager.broadcast(message);
        expect(clusterSpy).toHaveBeenCalledTimes(options.totalClusters);
        expect(clusterSpy).toHaveBeenCalledWith(message);
    });
    test('ClusterManager restarts clusters correctly', () => {
        const clusterSpy = jest.spyOn(Cluster_1.Cluster.prototype, 'restart');
        clusterManager.restart(0);
        expect(clusterSpy).toHaveBeenCalledTimes(1);
    });
    test('ClusterManager sends disconnect IPC message correctly', () => {
        const clusterSpy = jest.spyOn(Cluster_1.Cluster.prototype, 'sendDisconnect');
        clusterManager.sendDisconnect(0);
        expect(clusterSpy).toHaveBeenCalledTimes(1);
    });
    test('ClusterManager kills clusters correctly', () => {
        const clusterSpy = jest.spyOn(Cluster_1.Cluster.prototype, 'kill');
        clusterManager.kill(0);
        expect(clusterSpy).toHaveBeenCalledTimes(1);
    });
    test('ClusterManager handles cluster exit correctly', () => {
        const clusterSpy = jest.spyOn(Cluster_1.Cluster.prototype, 'onExit');
        const code = 0;
        const signal = 'SIGTERM';
        const clusterManager = new ClusterManager_1.ClusterManager();
        clusterManager.fork();
        clusterManager.fork();
        clusterManager.fork();
        const worker = clusterManager.getWorker();
        clusterManager.onExit(worker, code, signal);
        expect(clusterSpy).toHaveBeenCalled();
        expect(clusterSpy).toHaveBeenCalledWith(worker, code, signal);
        expect(clusterManager.workers).toHaveLength(2);
    });
});
