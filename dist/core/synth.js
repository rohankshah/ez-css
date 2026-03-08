"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
function synthAction() {
    return __awaiter(this, void 0, void 0, function* () {
        const runPath = process.env.INIT_CWD;
        const configPath = runPath + '/.ez-css-config';
        // Check if .ez-css-config exists
        try {
            const configExists = yield checkIfFileExists(configPath);
            if (!configExists) {
                throw 'Config not found';
            }
        }
        catch (e) {
            console.error(e);
        }
    });
}
function checkIfFileExists(pathToCheck) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = yield (0, promises_1.stat)(pathToCheck);
            return stats.isFile();
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    });
}
exports.default = synthAction;
//# sourceMappingURL=synth.js.map