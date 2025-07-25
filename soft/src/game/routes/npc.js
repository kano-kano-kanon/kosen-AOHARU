// npc.js
const express = require("express");
const router = express.Router();
const npcData = require("../data/npcData");

router.get("/", (req, res) => {
  res.json(npcData);
});

module.exports = router;
