const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

/**
 * Extracts a zip file to destDir and returns an array of extracted file info
 * [{ name, path }]
 */
const extractZipToDir = async (zipPath, destDir) => {
  try {
    const zip = new AdmZip(zipPath);

    // Ensure destination exists
    fs.mkdirSync(destDir, { recursive: true });

    const entries = zip.getEntries();
    const extracted = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const entryName = entry.entryName.replace(/\\/g, '/');
      const outPath = path.join(destDir, entryName);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, entry.getData());
      extracted.push({ name: entryName, path: outPath });
    }

    return extracted;
  } catch (err) {
    throw new Error(`Failed to extract zip: ${err.message}`);
  }
};

const listFilesRecursively = (dir) => {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...listFilesRecursively(itemPath));
    } else {
      files.push({ name: path.relative(dir, itemPath), path: itemPath });
    }
  }

  return files;
};

const cleanupDir = async (dir) => {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`Failed to cleanup dir ${dir}: ${err.message}`);
  }
};

module.exports = {
  extractZipToDir,
  listFilesRecursively,
  cleanupDir
};
