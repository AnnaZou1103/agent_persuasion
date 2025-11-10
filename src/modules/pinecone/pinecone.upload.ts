/**
 * Pinecone File Upload Module
 * Handles uploading files and metadata to Pinecone Assistant
 */

import { PINECONE_CONFIG, isPineconeEnabled } from './pinecone.config';
import { Standpoint } from './pinecone.types';

/**
 * File metadata structure
 */
export interface FileMetadata {
  stance?: Standpoint;
  title?: string;
  author?: string;
  category?: string;
  tags?: string[];
  description?: string;
  sourceUrl?: string; // Source URL of the original file
  [key: string]: any; // Allow custom metadata fields
}

/**
 * Upload response from Pinecone
 */
export interface UploadResponse {
  id: string;
  name: string;
  status: string;
  size: number;
  metadata: FileMetadata;
  created_on: string;
  updated_on: string;
  percent_done: number;
  signed_url: string;
  error_message: string | null;
}

/**
 * Upload options
 */
export interface UploadOptions {
  file: File | Blob;
  fileName: string;
  metadata?: FileMetadata;
}

/**
 * Batch upload result
 */
export interface BatchUploadResult {
  successful: UploadResponse[];
  failed: Array<{
    fileName: string;
    error: string;
  }>;
}

/**
 * Upload a single file with metadata to Pinecone Assistant
 * 
 * @param options - Upload options including file, fileName, and metadata
 * @returns Promise with upload response
 * 
 * @example
 * ```typescript
 * const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
 * const result = await uploadFile({
 *   file,
 *   fileName: 'my-document.pdf',
 *   metadata: {
 *     stance: 'supporting',
 *     title: 'Climate Change Evidence',
 *     category: 'Science',
 *     tags: ['climate', 'research']
 *   }
 * });
 * ```
 */
export async function uploadFile(
  options: UploadOptions
): Promise<UploadResponse> {
  if (!isPineconeEnabled()) {
    throw new Error('Pinecone is not enabled. Please configure PINECONE_API_KEY and PINECONE_ASSISTANT_NAME.');
  }

  const { file, fileName, metadata = {} } = options;

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file, fileName);
    
    // Add metadata as JSON string
    if (Object.keys(metadata).length > 0) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    // Upload to Pinecone Assistant
    const response = await fetch(
      `https://prod-1-data.ke.pinecone.io/assistant/files/${PINECONE_CONFIG.assistantName}`,
      {
        method: 'POST',
        headers: {
          'Api-Key': PINECONE_CONFIG.apiKey,
          'accept': 'application/json',
          'X-Pinecone-API-Version': '2025-04',
          // Note: Don't set Content-Type header, browser will set it automatically with boundary for multipart/form-data
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Pinecone upload failed: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const result: UploadResponse = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading file to Pinecone:', error);
    throw error;
  }
}

/**
 * Upload multiple files with metadata in batch
 * 
 * @param files - Array of upload options
 * @returns Promise with batch upload results
 * 
 * @example
 * ```typescript
 * const files = [
 *   {
 *     file: new File(['content1'], 'doc1.pdf'),
 *     fileName: 'doc1.pdf',
 *     metadata: { stance: 'supporting', category: 'Research' }
 *   },
 *   {
 *     file: new File(['content2'], 'doc2.pdf'),
 *     fileName: 'doc2.pdf',
 *     metadata: { stance: 'opposing', category: 'Opinion' }
 *   }
 * ];
 * 
 * const results = await uploadFileBatch(files);
 * console.log(`Successful: ${results.successful.length}, Failed: ${results.failed.length}`);
 * ```
 */
export async function uploadFileBatch(
  files: UploadOptions[]
): Promise<BatchUploadResult> {
  const successful: UploadResponse[] = [];
  const failed: Array<{ fileName: string; error: string }> = [];

  // Upload files sequentially to avoid overwhelming the API
  for (const fileOptions of files) {
    try {
      const result = await uploadFile(fileOptions);
      successful.push(result);
    } catch (error) {
      failed.push({
        fileName: fileOptions.fileName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { successful, failed };
}

/**
 * Upload multiple files in parallel (use with caution for large batches)
 * 
 * @param files - Array of upload options
 * @param concurrency - Maximum number of parallel uploads (default: 3)
 * @returns Promise with batch upload results
 */
export async function uploadFileBatchParallel(
  files: UploadOptions[],
  concurrency: number = 3
): Promise<BatchUploadResult> {
  const successful: UploadResponse[] = [];
  const failed: Array<{ fileName: string; error: string }> = [];

  // Process files in chunks based on concurrency limit
  for (let i = 0; i < files.length; i += concurrency) {
    const chunk = files.slice(i, i + concurrency);
    
    const results = await Promise.allSettled(
      chunk.map(fileOptions => uploadFile(fileOptions))
    );

    results.forEach((result, index) => {
      const fileOptions = chunk[index];
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          fileName: fileOptions.fileName,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    });
  }

  return { successful, failed };
}

/**
 * Get upload status of a file
 * 
 * @param fileId - The ID of the uploaded file
 * @returns Promise with file status information
 */
export async function getFileStatus(fileId: string): Promise<UploadResponse> {
  if (!isPineconeEnabled()) {
    throw new Error('Pinecone is not enabled.');
  }

  try {
    const response = await fetch(
      `https://prod-1-data.ke.pinecone.io/assistant/files/${PINECONE_CONFIG.assistantName}/${fileId}`,
      {
        method: 'GET',
        headers: {
          'Api-Key': PINECONE_CONFIG.apiKey,
          'accept': 'application/json',
          'X-Pinecone-API-Version': '2025-04',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get file status: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting file status:', error);
    throw error;
  }
}

/**
 * Delete a file from Pinecone Assistant
 * 
 * @param fileId - The ID of the file to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteFile(fileId: string): Promise<void> {
  if (!isPineconeEnabled()) {
    throw new Error('Pinecone is not enabled.');
  }

  try {
    const response = await fetch(
      `https://prod-1-data.ke.pinecone.io/assistant/files/${PINECONE_CONFIG.assistantName}/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Api-Key': PINECONE_CONFIG.apiKey,
          'accept': 'application/json',
          'X-Pinecone-API-Version': '2025-04',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * List all files in Pinecone Assistant
 * 
 * @returns Promise with array of file information
 */
export async function listFiles(): Promise<UploadResponse[]> {
  if (!isPineconeEnabled()) {
    throw new Error('Pinecone is not enabled.');
  }

  try {
    const response = await fetch(
      `https://prod-1-data.ke.pinecone.io/assistant/files/${PINECONE_CONFIG.assistantName}`,
      {
        method: 'GET',
        headers: {
          'Api-Key': PINECONE_CONFIG.apiKey,
          'accept': 'application/json',
          'X-Pinecone-API-Version': '2025-04',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

