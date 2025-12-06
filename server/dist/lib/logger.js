"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (data, message) => {
        console.log(`[INFO] ${message}`, data);
    },
    error: (data, message) => {
        console.error(`[ERROR] ${message}`, data);
    },
    warn: (data, message) => {
        console.warn(`[WARN] ${message}`, data);
    },
    debug: (data, message) => {
        console.debug(`[DEBUG] ${message}`, data);
    }
};
//# sourceMappingURL=logger.js.map