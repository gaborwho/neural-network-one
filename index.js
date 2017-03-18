'use strict';

const fs = require('fs');

const _ = require('lodash');
const co = require('co');
const fanny = require('fanny');
const FNN = require('ml-fnn');
const Jimp = require('jimp');

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

const unitVector = function(dimensions, direction) {
  const zeroVector = Array(dimensions).fill(0);
  const diff = _.set({}, direction, 1); 
  return Object.assign(zeroVector, diff);
}

const evaluateResult = function(resultVector) {
  return resultVector.map(Math.round);
}

co(function*() {
  const images = loadDatabase('mnist/train-images-idx3-ubyte');
  const labels = loadDatabase('mnist/train-labels-idx1-ubyte');
  const flatImages = images.map(_.flatten);

  const testImages = loadDatabase('mnist/t10k-images-idx3-ubyte');
  const flatTestImages = images.map(_.flatten);
  const testLabels = loadDatabase('mnist/t10k-labels-idx1-ubyte');

  const dataset = flatImages.map((image, index) => ({ input: image, output: unitVector(10, labels[index]) }));

  const ann = fanny.createANN({
    layers: [ flatImages[0].length, 30, 10 ],
    activationFunctions: {
        hidden: 'SIGMOID',
        output: 'SIGMOID'
    },
  });
  const trainingData = fanny.createTrainingData(dataset.slice(1, 30000));
  console.log('start training');
  console.time('train');
  yield ann.train(trainingData, { maxEpochs: 200, desiredError: 0.01 }, console.log)
  console.timeEnd('train');
  console.log('trained');

  const fnn = new FNN({ hiddenLayers: [] });
  fnn.train(flatImages, labels);

  for (let i = 0; i < 10; i++) {
    printImage(testImages[i], testLabels[i]);
    console.log(evaluateResult(fnn.predict(flatTestImages[i])), testLabels[i]);
  }

  for (let i = 0; i < 10; i++) {
    console.log(evaluateResult(fnn.predict(flatImages[i])), labels[i]);
  }
})
  .catch(console.log);


