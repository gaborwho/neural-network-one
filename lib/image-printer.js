'use strict';

const Jimp = require('jimp');

const printImage = function(imageData, label) {
  new Jimp(imageData.length, imageData[0].length, function (err, image) {
    image.opaque();
    for (let i = 0; i < imageData.length; i++) {
      for (let j = 0; j < imageData[i].length; j++) {
        const pixelValue = 255 - imageData[i][j];
        image.setPixelColor(Jimp.rgbaToInt(pixelValue, pixelValue, pixelValue, 255), j, i);
      }
    }
    image.write(`tmp/image_${label}.png`, () => {console.log('done')});
  });
}

module.exports = printImage;

