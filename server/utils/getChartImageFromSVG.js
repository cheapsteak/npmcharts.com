const fs = require('fs');
const sharp = require('sharp');

module.exports = () => {
  // const svgContents = fs.readFileSync(__dirname + '/chart.svg', 'utf8');
  const svgContents = fs.readFileSync(__dirname + '/chart.svg');
  return sharp(svgContents)
    .png()
    .toBuffer();
};
