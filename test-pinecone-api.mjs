/**
 * Test different ways to upload metadata to Pinecone
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env.local') });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ASSISTANT_NAME = process.env.PINECONE_ASSISTANT_NAME;

// Test 1: Upload with metadata in FormData (current implementation)
async function test1_metadataInFormData() {
  console.log('TEST 1: Metadata in FormData (current implementation)');
  console.log('='.repeat(80));
  
  const testContent = 'Test file for metadata in FormData';
  const blob = new Blob([testContent], { type: 'text/plain' });
  
  const formData = new FormData();
  formData.append('file', blob, 'test-formdata.txt');
  formData.append('metadata', JSON.stringify({ stance: 'supporting', test: 'formdata' }));
  
  const response = await fetch(
    `https://prod-1-data.ke.pinecone.io/assistant/files/${PINECONE_ASSISTANT_NAME}`,
    {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'accept': 'application/json',
        'X-Pinecone-API-Version': '2025-04',
      },
      body: formData,
    }
  );
  
  const result = await response.json();
  console.log('Response metadata:', result.metadata);
  console.log('');
  
  return result.id;
}

// Test 2: Try updating metadata after upload using PATCH
async function test2_updateMetadataAfterUpload(fileId) {
  console.log('TEST 2: Update metadata after upload using PATCH');
  console.log('='.repeat(80));
  
  const response = await fetch(
    `https://prod-1-data.ke.pinecone.io/assistant/files/${PINECONE_ASSISTANT_NAME}/${fileId}`,
    {
      method: 'PATCH',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Pinecone-API-Version': '2025-04',
      },
      body: JSON.stringify({
        metadata: { stance: 'supporting', test: 'patch' }
      }),
    }
  );
  
  console.log('Status:', response.status, response.statusText);
  
  if (response.ok) {
    const result = await response.json();
    console.log('Response metadata:', result.metadata);
  } else {
    const error = await response.text();
    console.log('Error:', error);
  }
  console.log('');
}

// Test 3: Check if metadata appears in GET request
async function test3_checkFileMetadata(fileId) {
  console.log('TEST 3: Check file metadata via GET');
  console.log('='.repeat(80));
  
  // Wait a bit for processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const response = await fetch(
    `https://prod-1-data.ke.pinecone.io/assistant/files/${PINECONE_ASSISTANT_NAME}/${fileId}`,
    {
      method: 'GET',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'accept': 'application/json',
        'X-Pinecone-API-Version': '2025-04',
      },
    }
  );
  
  const result = await response.json();
  console.log('Status:', result.status);
  console.log('Metadata:', result.metadata);
  console.log('');
}

// Test 4: Try with Content-Type in metadata field
async function test4_metadataAsFormField() {
  console.log('TEST 4: Metadata as separate form field with content-type');
  console.log('='.repeat(80));
  
  const testContent = 'Test file for metadata form field';
  const blob = new Blob([testContent], { type: 'text/plain' });
  
  const formData = new FormData();
  formData.append('file', blob, 'test-formfield.txt');
  
  // Try appending metadata as a blob with proper content type
  const metadataBlob = new Blob([JSON.stringify({ stance: 'opposing', test: 'blob' })], {
    type: 'application/json'
  });
  formData.append('metadata', metadataBlob);
  
  const response = await fetch(
    `https://prod-1-data.ke.pinecone.io/assistant/files/${PINECONE_ASSISTANT_NAME}`,
    {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'accept': 'application/json',
        'X-Pinecone-API-Version': '2025-04',
      },
      body: formData,
    }
  );
  
  const result = await response.json();
  console.log('Response metadata:', result.metadata);
  console.log('');
  
  return result.id;
}

// Run all tests
async function runTests() {
  try {
    const fileId1 = await test1_metadataInFormData();
    await test3_checkFileMetadata(fileId1);
    await test2_updateMetadataAfterUpload(fileId1);
    await test3_checkFileMetadata(fileId1);
    
    const fileId2 = await test4_metadataAsFormField();
    await test3_checkFileMetadata(fileId2);
    
    console.log('\n' + '='.repeat(80));
    console.log('CONCLUSION:');
    console.log('Check which method successfully stored the metadata');
    console.log('Test file IDs:', fileId1, fileId2);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

runTests();

