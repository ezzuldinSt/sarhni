import { put } from '@vercel/blob';

console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? 'SET' : 'NOT SET');
console.log('Token prefix:', process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20) + '...');
