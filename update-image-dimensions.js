const { pool } = require('./backend/src/config/database');
const storageService = require('./backend/src/services/storage');
const sharp = require('sharp');

async function updateImageDimensions() {
  const client = await pool.connect();
  
  try {
    // Get all images without dimensions
    const result = await client.query(`
      SELECT id, url FROM images 
      WHERE (width IS NULL OR height IS NULL) AND deleted_at IS NULL
      ORDER BY id
    `);
    
    console.log(`Found ${result.rows.length} images without dimensions`);
    
    for (const img of result.rows) {
      try {
        // Download image from MinIO
        const objectName = img.url.replace(/^\/[^/]+\//, '');
        console.log(`Processing image ${img.id}: ${objectName}`);
        
        const imageBuffer = await storageService.downloadFile(objectName);
        
        // Get dimensions using sharp
        const metadata = await sharp(imageBuffer).metadata();
        
        // Update database
        await client.query(
          'UPDATE images SET width = $1, height = $2 WHERE id = $3',
          [metadata.width, metadata.height, img.id]
        );
        
        console.log(`✅ Updated image ${img.id}: ${metadata.width}x${metadata.height}`);
      } catch (err) {
        console.error(`❌ Failed to process image ${img.id}:`, err.message);
      }
    }
    
    console.log('✅ Done updating image dimensions');
  } finally {
    client.release();
    process.exit(0);
  }
}

updateImageDimensions().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
