#!/usr/bin/env bun

import { readFileSync } from 'fs';

const API_URL = 'http://localhost:3000';
const content = readFileSync('./test-content.txt', 'utf-8');

console.log('🧪 Testing Streaming Generation\n');
console.log('='.repeat(50));

// Test streaming syllabus generation
async function testStreamingSyllabus() {
  console.log('\n📚 Test: Streaming Syllabus Generation');
  console.log('-'.repeat(50));
  
  try {
    const response = await fetch(`${API_URL}/api/generate/syllabus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let chunkCount = 0;

    console.log('\n📡 Streaming chunks:');
    console.log('-'.repeat(50));

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          if (data.type === 'chunk') {
            process.stdout.write(data.content);
            chunkCount++;
          } else if (data.type === 'done') {
            console.log('\n\n✅ Streaming complete!');
            console.log(`📊 Received ${chunkCount} chunks`);
            console.log('\n📋 Final Syllabus:');
            console.log(JSON.stringify(data.data, null, 2));
          } else if (data.type === 'error') {
            console.error('\n❌ Error:', data.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
(async () => {
  console.log('⏳ Starting test in 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testStreamingSyllabus();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Test completed');
  console.log('='.repeat(50));
})();
