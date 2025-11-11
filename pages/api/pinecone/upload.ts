/**
 * API Route for File Upload to Pinecone Assistant
 * 
 * POST /api/pinecone/upload
 * 
 * Handles file uploads with metadata to Pinecone Assistant
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File as FormidableFile } from 'formidable';
import fs from 'fs';
import { uploadFile, FileMetadata } from '~/modules/pinecone/pinecone.upload';

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

type UploadError = {
  error: string;
};

type UploadSuccess = {
  success: boolean;
  fileId: string;
  fileName: string;
  status: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadSuccess | UploadError>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
    });

    const [fields, files] = await form.parse(req);

    // Get the uploaded file
    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFile = fileArray[0] as FormidableFile;

    // Parse metadata from form fields
    const metadataString = fields.metadata?.[0];
    let metadata: FileMetadata = {};
    
    if (metadataString) {
      try {
        metadata = JSON.parse(metadataString);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid metadata JSON' });
      }
    }

    // Read file content
    const fileBuffer = await fs.promises.readFile(uploadedFile.filepath);
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: uploadedFile.mimetype || 'application/octet-stream' });

    // Upload to Pinecone (with stance encoded in filename)
    const result = await uploadFile({
      file: blob,
      fileName: uploadedFile.originalFilename || 'unnamed-file',
      metadata,
    });

    // Clean up temporary file
    await fs.promises.unlink(uploadedFile.filepath);

    return res.status(200).json({
      success: true,
      fileId: result.id,
      fileName: result.name,
      status: result.status,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
}

