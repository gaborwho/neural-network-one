'use strict';

const fs = require('fs');

const _ = require('lodash');
const Jimp = require('jimp');

const loadImages = function(filename) {
  const database = fs.readFileSync(filename);

  const magic = database.readUInt16BE(0);
  if (magic !== 0) { throw new Error("corrupt file"); }

  const dataType = database.readUInt8(2);
  if (dataType !== 0x08) { throw new Error("unknown data type"); }

  const numberOfDimensions = database.readUInt8(3);
  if (numberOfDimensions !== 3) { throw new Error("unknown number of dimensions"); }

  const numberOfImages = database.readUInt32BE(4);
  const numberOfRows = database.readUInt32BE(8);
  const numberOfColumns = database.readUInt32BE(12);

  const data = Array(database.length - 16).fill().map((_, index) => database.readUInt8(16 + index));
  const images = _(data).chunk(numberOfColumns).chunk(numberOfRows).value();

  return images;
};

const printImage = function(imageData) {
  new Jimp(imageData.length, imageData[0].length, function (err, image) {
    image.opaque();
    for (let i = 0; i < imageData.length; i++) {
      for (let j = 0; j < imageData[i].length; j++) {
        const pixelValue = 255 - imageData[i][j];
        image.setPixelColor(Jimp.rgbaToInt(pixelValue, pixelValue, pixelValue, 255), j, i);
      }
    }
    image.write('tmp/image.png', () => {console.log('done')});
  });
}

const images = loadImages('mnist/t10k-images-idx3-ubyte');
printImage(images[0]);

