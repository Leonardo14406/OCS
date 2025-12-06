"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json({ message: "API Routes", version: "1.0.0" });
});
router.get("/users", (req, res) => {
    res.json({
        users: [], message: "Users endpoint - to be implemented"
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map