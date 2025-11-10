/**
 * Example Usage of Pinecone File Upload Functions
 * 
 * This file demonstrates how to use the upload functions in different scenarios
 */

import {
  uploadFile,
  uploadFileBatch,
  uploadFileBatchParallel,
  getFileStatus,
  deleteFile,
  listFiles,
  FileMetadata,
  UploadResponse,
} from './pinecone.upload';

// ============================================
// Example 1: Upload a single file with metadata
// ============================================
export async function exampleSingleUpload() {
  try {
    // Assume we have a file from an input element
    const file = new File(
      ['This is a research paper about climate change...'],
      'climate-research.pdf',
      { type: 'application/pdf' }
    );

    const metadata: FileMetadata = {
      stance: 'supporting',
      title: 'Climate Change: Scientific Evidence',
      author: 'Dr. Jane Smith',
      category: 'Research Paper',
      tags: ['climate', 'science', 'environment'],
      description: 'A comprehensive review of climate change evidence',
      sourceUrl: 'https://example.com/original-paper.pdf',
    };

    const result = await uploadFile({
      file,
      fileName: 'climate-research.pdf',
      metadata,
    });

    console.log('Upload successful:', result);
    console.log('File ID:', result.id);
    console.log('Status:', result.status);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

// ============================================
// Example 2: Upload multiple files with different stances
// ============================================
export async function exampleBatchUpload() {
  const files = [
    {
      file: new File(['Supporting content...'], 'support-1.pdf'),
      fileName: 'climate-support-1.pdf',
      metadata: {
        stance: 'supporting' as const,
        title: 'Benefits of Renewable Energy',
        category: 'Research',
      },
    },
    {
      file: new File(['Opposing content...'], 'oppose-1.pdf'),
      fileName: 'climate-oppose-1.pdf',
      metadata: {
        stance: 'opposing' as const,
        title: 'Economic Concerns of Climate Policies',
        category: 'Analysis',
      },
    },
    {
      file: new File(['Neutral content...'], 'neutral-1.pdf'),
      fileName: 'climate-neutral-1.pdf',
      metadata: {
        title: 'Climate Change Timeline',
        category: 'Reference',
      },
    },
  ];

  try {
    const results = await uploadFileBatch(files);
    
    console.log(`Successfully uploaded: ${results.successful.length} files`);
    console.log(`Failed uploads: ${results.failed.length} files`);

    if (results.failed.length > 0) {
      console.log('Failed files:', results.failed);
    }

    return results;
  } catch (error) {
    console.error('Batch upload error:', error);
  }
}

// ============================================
// Example 3: Upload files from file input (React/Next.js)
// ============================================
export async function exampleFileInputUpload(
  fileInput: HTMLInputElement,
  stance: 'supporting' | 'opposing'
) {
  const files = fileInput.files;
  if (!files || files.length === 0) {
    console.error('No files selected');
    return;
  }

  const uploadOptions = Array.from(files).map(file => ({
    file,
    fileName: file.name,
    metadata: {
      stance,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      uploadedAt: new Date().toISOString(),
    },
  }));

  try {
    // Upload in parallel with max 3 concurrent uploads
    const results = await uploadFileBatchParallel(uploadOptions, 3);
    
    console.log('Upload complete!');
    console.log('Successful:', results.successful.map(r => r.name));
    
    if (results.failed.length > 0) {
      console.error('Failed uploads:', results.failed);
    }

    return results;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// ============================================
// Example 4: Check file upload status
// ============================================
export async function exampleCheckStatus(fileId: string) {
  try {
    const status = await getFileStatus(fileId);
    
    console.log('File status:', status.status);
    console.log('Processing progress:', status.percent_done);
    
    if (status.status === 'Processing') {
      console.log('File is still being processed...');
      // You might want to poll until status becomes 'Available'
    } else if (status.status === 'Available') {
      console.log('File is ready for use!');
    } else if (status.status === 'Error') {
      console.error('File processing failed:', status.error_message);
    }

    return status;
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

// ============================================
// Example 5: Poll file status until ready
// ============================================
export async function examplePollUntilReady(
  fileId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const status = await getFileStatus(fileId);
      
      if (status.status === 'Available') {
        console.log('File is ready!');
        return true;
      } else if (status.status === 'Error') {
        console.error('File processing failed');
        return false;
      }
      
      console.log(`Waiting... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error('Error polling status:', error);
      return false;
    }
  }
  
  console.error('Timeout waiting for file to be ready');
  return false;
}

// ============================================
// Example 6: List all uploaded files
// ============================================
export async function exampleListFiles() {
  try {
    const files = await listFiles();
    
    console.log(`Total files: ${files.length}`);
    
    // Group by stance
    const supporting = files.filter(f => f.metadata?.stance === 'supporting');
    const opposing = files.filter(f => f.metadata?.stance === 'opposing');
    const neutral = files.filter(f => !f.metadata?.stance);
    
    console.log(`Supporting: ${supporting.length}`);
    console.log(`Opposing: ${opposing.length}`);
    console.log(`Neutral: ${neutral.length}`);
    
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
  }
}

// ============================================
// Example 7: Delete a file
// ============================================
export async function exampleDeleteFile(fileId: string) {
  try {
    await deleteFile(fileId);
    console.log('File deleted successfully');
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// ============================================
// Example 8: Complete workflow - Upload and wait for processing
// ============================================
export async function exampleCompleteWorkflow() {
  try {
    // 1. Upload file
    const file = new File(['Content...'], 'document.pdf');
    console.log('Uploading file...');
    
    const uploadResult = await uploadFile({
      file,
      fileName: 'my-document.pdf',
      metadata: {
        stance: 'supporting',
        title: 'My Document',
        category: 'Research',
      },
    });
    
    console.log('Upload successful, file ID:', uploadResult.id);
    
    // 2. Wait for processing
    console.log('Waiting for file to be processed...');
    const isReady = await examplePollUntilReady(uploadResult.id);
    
    if (isReady) {
      console.log('File is ready to use in conversations!');
      
      // 3. Verify it's in the list
      const allFiles = await listFiles();
      const ourFile = allFiles.find(f => f.id === uploadResult.id);
      console.log('File verified in list:', ourFile?.name);
    }
    
    return uploadResult;
  } catch (error) {
    console.error('Workflow error:', error);
    throw error;
  }
}

// ============================================
// Example 9: Bulk upload with progress tracking
// ============================================
export async function exampleBulkUploadWithProgress(
  files: File[],
  stance: 'supporting' | 'opposing',
  onProgress?: (current: number, total: number) => void
) {
  const uploadOptions = files.map(file => ({
    file,
    fileName: file.name,
    metadata: {
      stance,
      uploadedAt: new Date().toISOString(),
    },
  }));

  const results: {
    successful: UploadResponse[];
    failed: Array<{ fileName: string; error: string }>;
  } = {
    successful: [],
    failed: [],
  };

  for (let i = 0; i < uploadOptions.length; i++) {
    try {
      const result = await uploadFile(uploadOptions[i]);
      results.successful.push(result);
      onProgress?.(i + 1, uploadOptions.length);
    } catch (error) {
      results.failed.push({
        fileName: uploadOptions[i].fileName,
        error: error instanceof Error ? error.message : String(error),
      });
      onProgress?.(i + 1, uploadOptions.length);
    }
  }

  return results;
}

