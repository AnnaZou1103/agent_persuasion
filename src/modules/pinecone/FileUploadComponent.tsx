/**
 * File Upload Component for Pinecone Assistant
 * 
 * A React component that provides a UI for uploading files with metadata
 */

import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Option,
  Select,
  Sheet,
  Stack,
  Textarea,
  Typography,
  LinearProgress,
  Alert,
} from '@mui/joy';
import { CloudUpload, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

import {
  uploadFile,
  uploadFileBatch,
  getFileStatus,
  FileMetadata,
  UploadResponse,
} from './pinecone.upload';
import { Standpoint } from './pinecone.types';

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  message?: string;
  fileId?: string;
}

export function FileUploadComponent() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [stance, setStance] = useState<Standpoint>('supporting');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' });
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus({
        status: 'error',
        message: 'Please select at least one file',
      });
      return;
    }

    try {
      setUploadStatus({ status: 'uploading' });
      setUploadProgress(0);

      const metadata: FileMetadata = {
        stance,
        title: title || undefined,
        category: category || undefined,
        description: description || undefined,
        sourceUrl: sourceUrl || undefined,
        uploadedAt: new Date().toISOString(),
      };

      if (selectedFiles.length === 1) {
        // Single file upload
        const result = await uploadFile({
          file: selectedFiles[0],
          fileName: selectedFiles[0].name,
          metadata,
        });

        setUploadStatus({ status: 'processing', fileId: result.id });
        
        // Poll for completion
        await pollFileStatus(result.id);
      } else {
        // Multiple files upload
        const uploadOptions = selectedFiles.map((file) => ({
          file,
          fileName: file.name,
          metadata: {
            ...metadata,
            originalFileName: file.name,
          },
        }));

        const results = await uploadFileBatch(uploadOptions);

        if (results.failed.length > 0) {
          setUploadStatus({
            status: 'error',
            message: `${results.successful.length} succeeded, ${results.failed.length} failed`,
          });
        } else {
          setUploadStatus({
            status: 'success',
            message: `Successfully uploaded ${results.successful.length} files`,
          });
        }

        setUploadProgress(100);
      }

      // Reset form
      setSelectedFiles([]);
      setTitle('');
      setCategory('');
      setDescription('');
      setSourceUrl('');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  };

  const pollFileStatus = async (fileId: string, maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const status = await getFileStatus(fileId);
        
        if (status.status === 'Available') {
          setUploadStatus({
            status: 'success',
            message: 'File uploaded and processed successfully',
            fileId,
          });
          setUploadProgress(100);
          return;
        } else if (status.status === 'Error') {
          setUploadStatus({
            status: 'error',
            message: 'File processing failed',
          });
          return;
        }

        // Update progress
        setUploadProgress(Math.min((i / maxAttempts) * 100, 95));
        
        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error polling status:', error);
        setUploadStatus({
          status: 'error',
          message: 'Error checking file status',
        });
        return;
      }
    }

    setUploadStatus({
      status: 'error',
      message: 'Timeout waiting for file processing',
    });
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const isUploading = uploadStatus.status === 'uploading' || uploadStatus.status === 'processing';

  return (
    <Sheet variant="outlined" sx={{ p: 3, borderRadius: 'md' }}>
      <Typography level="h3" sx={{ mb: 2 }}>
        Upload Files to Knowledge Base
      </Typography>

      <Stack spacing={2}>
        {/* File selection */}
        <FormControl>
          <FormLabel>Select Files</FormLabel>
          <Button
            component="label"
            startDecorator={<CloudUpload />}
            variant="outlined"
            disabled={isUploading}
          >
            Choose Files
            <input
              type="file"
              multiple
              hidden
              onChange={handleFileSelect}
              accept=".pdf,.txt,.doc,.docx,.md"
            />
          </Button>
          {selectedFiles.length > 0 && (
            <Typography level="body-sm" sx={{ mt: 1 }}>
              {selectedFiles.length} file(s) selected:{' '}
              {selectedFiles.map((f) => f.name).join(', ')}
            </Typography>
          )}
        </FormControl>

        {/* Stance selection */}
        <FormControl>
          <FormLabel>Stance/Position</FormLabel>
          <Select
            value={stance}
            onChange={(_, value) => value && setStance(value)}
            disabled={isUploading}
          >
            <Option value="supporting">Supporting - Align with user&apos;s viewpoint</Option>
            <Option value="opposing">Opposing - Challenge user&apos;s viewpoint</Option>
          </Select>
        </FormControl>

        {/* Title */}
        <FormControl>
          <FormLabel>Title (optional)</FormLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            disabled={isUploading}
          />
        </FormControl>

        {/* Category */}
        <FormControl>
          <FormLabel>Category (optional)</FormLabel>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Research, Opinion, News"
            disabled={isUploading}
          />
        </FormControl>

        {/* Source URL */}
        <FormControl>
          <FormLabel>Source URL (optional)</FormLabel>
          <Input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://example.com/source-document"
            disabled={isUploading}
            type="url"
          />
        </FormControl>

        {/* Description */}
        <FormControl>
          <FormLabel>Description (optional)</FormLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the content"
            minRows={2}
            disabled={isUploading}
          />
        </FormControl>

        {/* Upload button */}
        <Button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || isUploading}
          loading={isUploading}
          fullWidth
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>

        {/* Progress bar */}
        {isUploading && (
          <Box>
            <LinearProgress
              determinate
              value={uploadProgress}
              sx={{ mb: 1 }}
            />
            <Typography level="body-sm" textAlign="center">
              {uploadStatus.status === 'uploading'
                ? 'Uploading file...'
                : 'Processing file...'}
            </Typography>
          </Box>
        )}

        {/* Status message */}
        {uploadStatus.message && (
          <Alert
            color={uploadStatus.status === 'success' ? 'success' : 'danger'}
            startDecorator={getStatusIcon()}
          >
            {uploadStatus.message}
          </Alert>
        )}
      </Stack>
    </Sheet>
  );
}

/**
 * Simple file upload button component for inline usage
 */
export function SimpleFileUploadButton({
  stance,
  onUploadSuccess,
  onUploadError,
}: {
  stance: Standpoint;
  onUploadSuccess?: (result: UploadResponse) => void;
  onUploadError?: (error: Error) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFile({
        file,
        fileName: file.name,
        metadata: {
          stance,
          uploadedAt: new Date().toISOString(),
        },
      });

      onUploadSuccess?.(result);
    } catch (error) {
      onUploadError?.(error instanceof Error ? error : new Error('Upload failed'));
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <Button
      component="label"
      startDecorator={<CloudUpload />}
      loading={uploading}
      disabled={uploading}
    >
      Upload File
      <input type="file" hidden onChange={handleFileChange} />
    </Button>
  );
}

