import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    // Optional — null means "general chat" (no dataset context)
    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset',
      default: null,
    },
    // Session ID groups multiple turns into a single conversation thread.
    // Frontend generates a UUID at "New Chat" and reuses it for every turn.
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      index: true,
    },
    // Human's message
    message: {
      type: String,
      trim: true,
    },
    question: {
      type: String,
      trim: true,
    },
    // AI's response
    response: {
      type: String,
      default: '',
    },
    answer: {
      type: String,
      default: '',
    },
    citations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// Compound index: fast per-session queries sorted by time
chatHistorySchema.index({ userId: 1, sessionId: 1, createdAt: 1 });
// Fast per-dataset queries
chatHistorySchema.index({ userId: 1, datasetId: 1, createdAt: 1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;
