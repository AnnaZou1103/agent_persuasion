/**
 * Test Pinecone SDK v4 API
 */

import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env.local') });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ASSISTANT_NAME = process.env.PINECONE_ASSISTANT_NAME;

async function testSDK() {
  console.log('Testing Pinecone SDK v4...\n');
  
  const pc = new Pinecone({
    apiKey: PINECONE_API_KEY,
  });
  
  console.log('Pinecone client created');
  console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(pc)));
  console.log('\n');
  
  // Check if assistant method exists
  if (typeof pc.assistant === 'function') {
    console.log('✅ pc.assistant() exists');
    const assistant = pc.assistant(PINECONE_ASSISTANT_NAME);
    console.log('Assistant methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(assistant)));
    console.log('\n');
    
    // Test upload with metadata
    // Create a test file
    const testFilePath = './test-sdk-upload.txt';
    writeFileSync(testFilePath, 'Test file for SDK upload with metadata');
    
    try {
      console.log('Attempting to upload file with metadata...');
      const result = await assistant.uploadFile({
        file: testFilePath,
        metadata: {
          stance: 'supporting',
          testField: 'sdk-test',
          timestamp: new Date().toISOString(),
        },
      });
      
      console.log('✅ Upload successful!');
      console.log('Result:', JSON.stringify(result, null, 2));
      
      // Wait and check file
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const files = await assistant.listFiles();
      const uploadedFile = files.find(f => f.name === 'test-sdk-upload.txt');
      
      if (uploadedFile) {
        console.log('\n File found in list:');
        console.log('Metadata:', uploadedFile.metadata);
      }
      
    } catch (error) {
      console.error('❌ Upload failed:', error.message);
    }
    
  } else {
    console.log('❌ pc.assistant() does NOT exist');
    console.log('This SDK version may not support Assistant API');
  }
}

testSDK().catch(console.error);

