"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
// Interfaces
__exportStar(require("./interfaces/IProcessManager"), exports);
__exportStar(require("./interfaces/IIPC"), exports);
// Types
__exportStar(require("./types"), exports);
// Processes
__exportStar(require("./processes/WorkerProcess"), exports);
__exportStar(require("./processes/ChildProcess"), exports);
// IPC
__exportStar(require("./ipc/IPCMessage"), exports);
// Queue
var Queue_1 = require("./queue/Queue");
Object.defineProperty(exports, "Queue", { enumerable: true, get: function () { return Queue_1.Queue; } });
// Utils
__exportStar(require("./utils/PromiseHandler"), exports);
//# sourceMappingURL=index.js.map