'use strict';

const fs = require('fs');

const _ = require('lodash');

const loadDatabase = function(filename) {
  const database = fs.readFileSync(filename);

  const magic = database.readUInt16BE(0);
  if (magic !== 0) { throw new Error("corrupt file"); }

  const dataType = database.readUInt8(2);
  if (dataType !== 0x08) { throw new Error("unknown data type"); }

  const numberOfDimensions = database.readUInt8(3);
  const dimensions = Array(numberOfDimensions).fill().map((_, index) => database.readUInt32BE(4 + index * 4));

  const headerSize = 4 + numberOfDimensions * 4;
  const data = Array(database.length - headerSize).fill().map((_, index) => database.readUInt8(headerSize + index));

  let images = data;
  for (let i = 0; i < numberOfDimensions - 1; i++) {
    images = _.chunk(images, dimensions[i + 1]);
  }

  return images;
};

module.exports = loadDatabase;

