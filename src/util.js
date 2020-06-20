const path = require('path');
const fs = require('fs');

async function getFileContent(file) {
  try {
    const data = await fs.promises.readFile(file, 'utf-8');
    return Buffer.from(data).toString();
  } catch (e) {
    return e;
  }
}

async function saveFile(file, content) {
  try {
    await fs.promises.writeFile(file, content);
    console.info(`Saved ${file}`);
  } catch (e) {
    return e;
  }
}

const getFileName = (path) => {
  return path.substring(path.lastIndexOf('/') + 1);
};

const extractViewbox = (svg) => {
  const [, x, y, width, height] =
    svg.match(/viewBox="(\d+) (\d+) (\d+) (\d+)"/) || [];
  return { x, y, width, height };
};

const extractPath = (svg) => {
  const [, d] = svg.match(/<path d="(.*?)"/) || [];
  return d;
};

const extractSymbolId = (svg) => {
  const [, d] = svg.match(/<symbol id="(.*?)"/) || [];
  return d;
};

const findFiles = (dirPath, regex) => {
  const allFiles = getAllFiles(dirPath);
  return allFiles.filter((f) => regex.test(f));
};

const getAllFiles = (dirPath, arrayOfFiles = []) => {
  files = fs.readdirSync(dirPath);
  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, '/', file));
    }
  });

  return arrayOfFiles;
};

module.exports = {
  extractPath,
  extractSymbolId,
  extractViewbox,
  findFiles,
  getFileContent,
  saveFile,
  getFileName,
};
