const fs = require('fs').promises;
const path = require('path');
const ipcModule = require('../src/controllers/ImageProcessingController');
(async () => {
  try {
    const controller = ipcModule._controller; // use exposed controller instance
    const annPath = path.join(__dirname, '../../Results/Labels/1_JPG.rf.b032c8eed42e7779a53f5bedc11d2a2d.txt');
    const content = await fs.readFile(annPath, 'utf-8');
    // Use imageId 213 (found in DB as having 4 parent teeth)
    const imageId = 213;
    // Get image size from DB via environment psql? We'll use defaults matching dataset (6240x4160)
    const width = 6240;
    const height = 4160;
    console.log('Calling _parseAndSaveSubboxes for image', imageId);
    await controller._parseAndSaveSubboxes(imageId, content, width, height);
    console.log('Done');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();