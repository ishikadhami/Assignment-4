const mongoose = require("mongoose");
const Note = require("../models/Note");
const eventBus = require("../events/eventBus");

async function listMyNotes(req, res, next) {
  try {
    const notes = await Note.find({ owner: req.user._id })
      .sort({ updatedAt: -1 });

    res.json({ count: notes.length, notes });
  } catch (error) {
    next(error);
  }
}

async function createNote(req, res, next) {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const note = await Note.create({
      title,
      content,
      owner: req.user._id,
    });

    eventBus.emit("note:created", {
      noteId: note._id.toString(),
      userId: req.user._id.toString(),
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
}

async function getMyNote(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    const note = await Note.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    next(error);
  }
}

async function updateMyNote(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.content !== undefined) updates.content = req.body.content;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Send a title or content to update" });
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    eventBus.emit("note:updated", {
      noteId: note._id.toString(),
      userId: req.user._id.toString(),
    });

    res.json(note);
  } catch (error) {
    next(error);
  }
}

async function deleteMyNote(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid note ID" });
    }

    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    eventBus.emit("note:deleted", {
      noteId: note._id.toString(),
      userId: req.user._id.toString(),
    });

    res.json({ message: "Note deleted" });
  } catch (error) {
    next(error);
  }
}

async function listAllNotesForAdmin(req, res, next) {
  try {
    const notes = await Note.find()
      .populate("owner", "username email")
      .sort({ updatedAt: -1 });

    res.json({ count: notes.length, notes });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listMyNotes,
  createNote,
  getMyNote,
  updateMyNote,
  deleteMyNote,
  listAllNotesForAdmin,
};