/**
 * Check current metadata status of uploaded documents
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

if (!PINECONE_API_KEY || !PINECONE_ASSISTANT_NAME) {
  console.error('❌ Missing Pinecone credentials in .env.local');
  process.exit(1);
}

async function checkMetadata() {
  try {
    console.log('📋 Checking Pinecone document metadata...\n');
    console.log(`Assistant: ${PINECONE_ASSISTANT_NAME}\n`);
    
    const response = await fetch(
      `https://prod-1-data.ke.pinecone.io/assistant/files/${PINECONE_ASSISTANT_NAME}`,
      {
        method: 'GET',
        headers: {
          'Api-Key': PINECONE_API_KEY,
          'accept': 'application/json',
          'X-Pinecone-API-Version': '2025-04',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const files = data.files || [];
    
    if (files.length === 0) {
      console.log('📭 No files found in Pinecone Assistant.');
      return;
    }
    
    console.log(`Found ${files.length} file(s):\n`);
    console.log('='.repeat(80));
    
    files.forEach((file, index) => {
      console.log(`\n${index + 1}. ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Status: ${file.status}`);
      console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`   Created: ${new Date(file.created_on).toLocaleString()}`);
      
      // Check for stance in filename
      const filenameStanceMatch = file.name.match(/^\[(supporting|opposing)\]/);
      if (filenameStanceMatch) {
        console.log(`   ✅ Stance in filename: ${filenameStanceMatch[1]}`);
      } else {
        console.log(`   ❌ No stance in filename`);
      }
      
      // Check metadata
      if (file.metadata) {
        console.log('   Metadata:', JSON.stringify(file.metadata));
        if (file.metadata.stance) {
          console.log(`   ✅ Stance in metadata: ${file.metadata.stance}`);
        }
      } else {
        console.log('   Metadata: null');
      }
      
      if (file.error_message) {
        console.log(`   ⚠️  Error: ${file.error_message}`);
      }
      
      console.log('-'.repeat(80));
    });
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(80));
    
    const withFilenameStance = files.filter(f => /^\[(supporting|opposing)\]/.test(f.name));
    const withMetadataStance = files.filter(f => f.metadata?.stance);
    const noStance = files.filter(f => 
      !/^\[(supporting|opposing)\]/.test(f.name) && !f.metadata?.stance
    );
    
    console.log(`Total files: ${files.length}`);
    console.log(`  ✅ With stance in filename: ${withFilenameStance.length}`);
    console.log(`  ✅ With stance in metadata: ${withMetadataStance.length}`);
    console.log(`  ❌ Without stance: ${noStance.length}`);
    
    if (noStance.length > 0) {
      console.log('\n⚠️  Files WITHOUT stance information:');
      noStance.forEach(f => {
        console.log(`     - ${f.name}`);
      });
      console.log('\n💡 These files will be FILTERED OUT during standpoint-based search.');
      console.log('   Please re-upload them with proper stance setting.');
    }
    
    if (withFilenameStance.length > 0) {
      console.log('\n✅ Files WITH stance in filename (will work correctly):');
      withFilenameStance.forEach(f => {
        const match = f.name.match(/^\[(supporting|opposing)\]/);
        console.log(`     [${match[1]}] ${f.name.replace(/^\[(supporting|opposing)\]/, '')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMetadata();



