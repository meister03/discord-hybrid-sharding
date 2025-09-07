"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
/**
 * Message types for IPC communication
 */
var MessageType;
(function (MessageType) {
    MessageType[MessageType["MISSING_TYPE"] = 0] = "MISSING_TYPE";
    MessageType[MessageType["CUSTOM_REQUEST"] = 1] = "CUSTOM_REQUEST";
    MessageType[MessageType["CUSTOM_MESSAGE"] = 2] = "CUSTOM_MESSAGE";
    MessageType[MessageType["CUSTOM_REPLY"] = 3] = "CUSTOM_REPLY";
    MessageType[MessageType["HEARTBEAT"] = 4] = "HEARTBEAT";
    MessageType[MessageType["HEARTBEAT_ACK"] = 5] = "HEARTBEAT_ACK";
    MessageType[MessageType["BROADCAST_REQUEST"] = 6] = "BROADCAST_REQUEST";
    MessageType[MessageType["BROADCAST_RESPONSE"] = 7] = "BROADCAST_RESPONSE";
    MessageType[MessageType["PROCESS_RESPAWN"] = 8] = "PROCESS_RESPAWN";
    MessageType[MessageType["PROCESS_RESPAWN_ALL"] = 9] = "PROCESS_RESPAWN_ALL";
    MessageType[MessageType["PROCESS_READY"] = 10] = "PROCESS_READY";
    MessageType[MessageType["EVAL_REQUEST"] = 11] = "EVAL_REQUEST";
    MessageType[MessageType["EVAL_RESPONSE"] = 12] = "EVAL_RESPONSE";
    MessageType[MessageType["MANAGER_EVAL_REQUEST"] = 13] = "MANAGER_EVAL_REQUEST";
    MessageType[MessageType["MANAGER_EVAL_RESPONSE"] = 14] = "MANAGER_EVAL_RESPONSE";
})(MessageType || (exports.MessageType = MessageType = {}));
//# sourceMappingURL=IIPC.js.map