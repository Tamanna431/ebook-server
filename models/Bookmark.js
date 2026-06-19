const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ebook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ebook',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure user can't bookmark same ebook twice
bookmarkSchema.index({ user: 1, ebook: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;