const fs = require("fs");
const fsp = require("fs/promises");
const { PNG } = require("pngjs");

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function sampleBlockLuma(png, startX, endX, startY, endY) {
  let total = 0;
  let count = 0;
  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const index = ((png.width * y) + x) << 2;
      const r = png.data[index];
      const g = png.data[index + 1];
      const b = png.data[index + 2];
      total += ((r * 299) + (g * 587) + (b * 114)) / 1000;
      count += 1;
    }
  }
  return count > 0 ? total / count : 0;
}

function computeAverageHash(filePath, size = 16) {
  const png = readPng(filePath);
  const values = [];

  for (let y = 0; y < size; y += 1) {
    const startY = Math.floor((y * png.height) / size);
    const endY = Math.max(startY + 1, Math.floor(((y + 1) * png.height) / size));
    for (let x = 0; x < size; x += 1) {
      const startX = Math.floor((x * png.width) / size);
      const endX = Math.max(startX + 1, Math.floor(((x + 1) * png.width) / size));
      values.push(sampleBlockLuma(png, startX, endX, startY, endY));
    }
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const hash = values.map((value) => (value >= average ? "1" : "0")).join("");
  return {
    width: png.width,
    height: png.height,
    hash
  };
}

function hammingDistance(left, right) {
  const max = Math.max(left.length, right.length);
  let distance = Math.abs(left.length - right.length);
  for (let index = 0; index < max && index < left.length && index < right.length; index += 1) {
    if (left[index] !== right[index]) {
      distance += 1;
    }
  }
  return distance;
}

async function compareOrUpdateVisualSnapshot({
  baselinePath,
  currentPath,
  update,
  threshold = 12
}) {
  await ensureDir(require("path").dirname(baselinePath));
  if (update || !fs.existsSync(baselinePath)) {
    await fsp.copyFile(currentPath, baselinePath);
    return {
      updated: true,
      baselinePath,
      currentPath,
      threshold,
      distance: 0
    };
  }

  const baseline = computeAverageHash(baselinePath);
  const current = computeAverageHash(currentPath);
  const distance = hammingDistance(baseline.hash, current.hash);
  const sizeMatches = baseline.width === current.width && baseline.height === current.height;

  return {
    updated: false,
    baselinePath,
    currentPath,
    threshold,
    distance,
    sizeMatches,
    baseline,
    current,
    pass: sizeMatches && distance <= threshold
  };
}

module.exports = {
  compareOrUpdateVisualSnapshot
};
