const express = require("express");
const controller = require("../controllers/backupController");

const router = express.Router();

router.get("/connection", controller.connection);
router.post("/run", controller.run);

module.exports = router;
