import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    embedding: {
      type: [Number],
      required: true,
      select: false,
    },

    metadata: {
      originalName: {
        type: String,
        required: true,
      },

      title: {
        type: String,
        required: true,
      },

      pageNumber: {
        type: Number,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

documentChunkSchema.index(
  {
    document: 1,
    chunkIndex: 1,
  },
  {
    unique: true,
  },
);

const DocumentChunk = mongoose.model("DocumentChunk", documentChunkSchema);

export default DocumentChunk;
