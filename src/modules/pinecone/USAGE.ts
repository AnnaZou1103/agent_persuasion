/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Pinecone File Upload - Quick Start Guide
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This guide demonstrates how to upload files with metadata to Pinecone Assistant
 * 
 * FEATURES:
 * ─────────────────────────────────────────────────────────────────────────────
 * ✓ Single file upload
 * ✓ Batch file upload (sequential)
 * ✓ Parallel batch upload (with concurrency control)
 * ✓ File status polling
 * ✓ File management (list, delete)
 * ✓ React UI components
 * ✓ Full TypeScript support
 * 
 * SETUP:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Set environment variables:
 *    PINECONE_API_KEY=your-api-key
 *    PINECONE_ASSISTANT_NAME=your-assistant-name
 * 
 * 2. Import the functions you need:
 * 
 *    import { uploadFile, uploadFileBatch } from '~/modules/pinecone';
 *    // or
 *    import { uploadFile } from '~/modules/pinecone/pinecone.upload';
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE 1: Basic File Upload
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { uploadFile } from './pinecone.upload';

export async function example1_basicUpload() {
  const file = new File(['Document content...'], 'document.pdf', {
    type: 'application/pdf',
  });

  const result = await uploadFile({
    file,
    fileName: 'my-document.pdf',
    metadata: {
      stance: 'supporting', // or 'opposing'
      title: 'Climate Change Evidence',
      category: 'Research',
    },
  });

  console.log('Uploaded:', result.id);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE 2: Upload with Rich Metadata
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function example2_richMetadata() {
  const file = new File(['...'], 'paper.pdf');

  const result = await uploadFile({
    file,
    fileName: 'research-paper.pdf',
    metadata: {
      stance: 'supporting',
      title: 'Renewable Energy Benefits',
      author: 'Dr. Jane Smith',
      category: 'Academic Research',
      tags: ['energy', 'sustainability', 'economics'],
      description: 'Comprehensive analysis of renewable energy economic benefits',
      sourceUrl: 'https://journal.example.com/articles/renewable-energy-2025',
      publicationDate: '2025-01-01',
      source: 'Journal of Energy Economics',
      // Add any custom fields you need
      customField: 'custom value',
    },
  });

  return result;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE 3: Batch Upload (Sequential)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { uploadFileBatch } from './pinecone.upload';

export async function example3_batchUpload(files: File[]) {
  const uploadOptions = files.map((file) => ({
    file,
    fileName: file.name,
    metadata: {
      stance: 'supporting' as const,
      uploadedAt: new Date().toISOString(),
    },
  }));

  const results = await uploadFileBatch(uploadOptions);

  console.log(`Success: ${results.successful.length}`);
  console.log(`Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.error('Failures:', results.failed);
  }

  return results;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE 4: Parallel Upload (Faster)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { uploadFileBatchParallel } from './pinecone.upload';

export async function example4_parallelUpload(files: File[]) {
  const uploadOptions = files.map((file) => ({
    file,
    fileName: file.name,
    metadata: { stance: 'opposing' as const },
  }));

  // Upload 3 files at a time
  const results = await uploadFileBatchParallel(uploadOptions, 3);

  return results;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE 5: Upload with Status Polling
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getFileStatus } from './pinecone.upload';

export async function example5_uploadAndWait(file: File) {
  // Upload the file
  const upload = await uploadFile({
    file,
    fileName: file.name,
    metadata: { stance: 'supporting' },
  });

  console.log('Uploaded, waiting for processing...');

  // Poll until ready
  for (let i = 0; i < 30; i++) {
    const status = await getFileStatus(upload.id);

    if (status.status === 'Available') {
      console.log('✓ File is ready!');
      return status;
    } else if (status.status === 'Error') {
      throw new Error('Processing failed');
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Timeout');
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE 6: File Management
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { listFiles, deleteFile } from './pinecone.upload';

export async function example6_management() {
  // List all files
  const files = await listFiles();
  console.log(`Total files: ${files.length}`);

  // Filter by stance
  const supporting = files.filter((f) => f.metadata?.stance === 'supporting');
  console.log(`Supporting documents: ${supporting.length}`);

  // Delete a file
  if (files.length > 0) {
    await deleteFile(files[0].id);
    console.log('Deleted:', files[0].name);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE 7: React Component Usage
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * In your React component:
 */

/*
import { FileUploadComponent } from '~/modules/pinecone';

export function MyPage() {
  return (
    <div>
      <h1>Upload Documents</h1>
      <FileUploadComponent />
    </div>
  );
}
*/

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE 8: Simple Upload Button
 * ═══════════════════════════════════════════════════════════════════════════
 */

/*
import { SimpleFileUploadButton } from '~/modules/pinecone';

export function MyComponent() {
  return (
    <SimpleFileUploadButton
      stance="supporting"
      onUploadSuccess={(result) => {
        console.log('Uploaded:', result.id);
      }}
      onUploadError={(error) => {
        console.error('Error:', error.message);
      }}
    />
  );
}
*/

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE 9: Upload from File Input
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function example9_fromFileInput(inputElement: HTMLInputElement) {
  const files = inputElement.files;
  if (!files) return;

  const results = await uploadFileBatch(
    Array.from(files).map((file) => ({
      file,
      fileName: file.name,
      metadata: {
        stance: 'supporting',
        uploadedAt: new Date().toISOString(),
      },
    }))
  );

  return results;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE 10: Upload with Progress Tracking
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function example10_withProgress(
  files: File[],
  onProgress: (current: number, total: number) => void
) {
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    await uploadFile({
      file: files[i],
      fileName: files[i].name,
      metadata: { stance: 'supporting' },
    });

    onProgress(i + 1, total);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXAMPLE 11: Upload with Source URL (for tracking original source)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function example11_withSourceUrl() {
  const file = new File(['Article content...'], 'article.pdf');

  // Upload a document with its original source URL
  const result = await uploadFile({
    file,
    fileName: 'climate-article.pdf',
    metadata: {
      stance: 'supporting',
      title: 'Climate Action is Critical',
      author: 'Environmental Journal',
      category: 'News Article',
      sourceUrl: 'https://example.com/news/climate-action-2025',
      description: 'Original article from environmental news website',
    },
  });

  console.log('Uploaded with source URL:', result.metadata.sourceUrl);
  return result;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TYPE DEFINITIONS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * FileMetadata {
 *   stance?: 'supporting' | 'opposing';  // Document position on topic
 *   title?: string;                      // Document title
 *   author?: string;                     // Author name
 *   category?: string;                   // Category/type
 *   tags?: string[];                     // Tags for organization
 *   description?: string;                // Brief description
 *   sourceUrl?: string;                  // Original source URL
 *   [key: string]: any;                  // Custom fields allowed
 * }
 * 
 * UploadResponse {
 *   id: string;                          // Unique file ID
 *   name: string;                        // File name
 *   status: string;                      // 'Processing' | 'Available' | 'Error'
 *   size: number;                        // File size in bytes
 *   metadata: FileMetadata;              // Your metadata
 *   created_on: string;                  // ISO timestamp
 *   updated_on: string;                  // ISO timestamp
 * }
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * TIPS & BEST PRACTICES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 1. Always set the 'stance' metadata for conversational search filtering
 * 2. Use sequential batch upload for reliability, parallel for speed
 * 3. Poll file status after upload to ensure processing completes
 * 4. Use meaningful titles and categories for better organization
 * 5. Add tags to enable flexible filtering in your application
 * 6. Handle errors gracefully - network issues can occur
 * 7. Clean up failed uploads by checking and deleting error files
 * 8. Monitor your Pinecone usage/quotas when doing bulk uploads
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

