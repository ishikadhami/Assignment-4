const express = require("express");
const {
  listMyNotes,
  createNote,
  getMyNote,
  updateMyNote,
  deleteMyNote,
  listAllNotesForAdmin,
} = require("../controllers/noteController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

// Admin-only route—/:id route se pehle hona chahiye
router.get("/admin/all", authorize("admin"), listAllNotesForAdmin);

router.get("/", listMyNotes);
router.post("/", createNote);
router.get("/:id", getMyNote);
router.put("/:id", updateMyNote);
router.patch("/:id", updateMyNote);
router.delete("/:id", deleteMyNote);

module.exports = router;