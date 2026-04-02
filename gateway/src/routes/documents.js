import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { s3 } from "../config/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  upload.array("files"),
  async (req, res) => {
    try {
      const files = req.files;
      const user = req.user;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadResults = [];

      for (const file of files) {
        let fileKey;

        if (process.env.AWS_BUCKET_NAME) {
          fileKey = `${user.userId}/${uuidv4()}-${file.originalname}`;

          const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          });

          await s3.send(command);
          fileKey = `s3://${process.env.AWS_BUCKET_NAME}/${fileKey}`;
        } else {
          fileKey = `uploads/${file.filename}`;
        }

        const response = await axios.post(
          `${process.env.AI_SERVICE_URL}/documents`,
          {
            userId: user.userId,
            filename: file.originalname,
            filePath: fileKey,
            status: "pending",
          },
        );

        const documentId = response.data.documentId;

        uploadResults.push({
          documentId,
          filename: file.originalname,
        });
      }

      return res.status(200).json({
        message: "Upload successful",
        documents: uploadResults,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Upload failed" });
    }
  },
);

router.get("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(
      `${process.env.AI_SERVICE_URL}/documents/${id}/status`,
    );
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: "Document not found" });
    }
    return res.status(500).json({ error: "Failed to fetch document status" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const response = await axios.get(
      `${process.env.AI_SERVICE_URL}/documents/user/${userId}`,
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch documents" });
  }
});

export default router;
