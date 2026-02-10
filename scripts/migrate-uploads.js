const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');
require('dotenv').config({ path: '.env.local' });

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

async function migrateUploads() {
  if (!BLOB_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is required');
    console.log('Set it with: export BLOB_READ_WRITE_TOKEN="your_token_here"');
    process.exit(1);
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  // Check if uploads directory exists
  try {
    await fs.promises.access(uploadsDir);
  } catch {
    console.log('❌ Uploads directory does not exist:', uploadsDir);
    process.exit(1);
  }

  const allFiles = await fs.promises.readdir(uploadsDir);
  const files = allFiles.filter(f =>
    f.endsWith('.jpg') ||
    f.endsWith('.jpeg') ||
    f.endsWith('.png') ||
    f.endsWith('.gif') ||
    f.endsWith('.webp')
  );

  console.log(`Found ${files.length} image files to migrate\n`);

  if (files.length === 0) {
    console.log('No files to migrate. Exiting.');
    return;
  }

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const fileBuffer = await fs.promises.readFile(filePath);

    try {
      const blob = await put(file, fileBuffer, {
        access: 'public',
        token: BLOB_TOKEN,
      });

      results.push({
        old: `/api/uploads/${file}`,
        new: blob.url,
        file,
        uploadedAt: blob.uploadedAt
      });

      successCount++;
      console.log(`✅ ${file} → ${blob.url}`);
    } catch (error) {
      failCount++;
      console.error(`❌ Failed to migrate ${file}:`, error.message);
    }
  }

  // Save mapping for database update
  await fs.promises.writeFile(
    'upload-mapping.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Migration complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📄 Mapping saved to: upload-mapping.json`);
  console.log('='.repeat(50));

  // Show SQL update snippet
  if (results.length > 0) {
    const blobUrlBase = results[0].new.substring(0, results[0].new.lastIndexOf('/') + 1);
    console.log('\n📝 To update URLs in your database, run:');
    console.log(`\nUPDATE "User"`);
    console.log(`SET image = REPLACE(image, '/api/uploads/', '${blobUrlBase}')`);
    console.log(`WHERE image LIKE '/api/uploads/%';\n`);
  }
}

migrateUploads().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
