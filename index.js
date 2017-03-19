'use strict';

const _ = require('lodash');
const co = require('co');
const fanny = require('fanny');
const synaptic = require('synaptic');

const printImage = require('./lib/image-printer');
const loadDatabase = require('./lib/idx-loader');

const Neuron = synaptic.Neuron,
      Layer = synaptic.Layer,
      Network = synaptic.Network,
      Trainer = synaptic.Trainer,
      Architect = synaptic.Architect;


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
  yield ann.train(trainingData, { maxEpochs: 100, desiredError: 0.01 }, console.log)
  console.timeEnd('train');
  console.log('trained');

  for (let i = 0; i < 10; i++) {
    printImage(testImages[i], testLabels[i]);
    console.log(evaluateResult(ann.run(flatTestImages[i])), testLabels[i]);
  }

  for (let i = 0; i < 10; i++) {
    console.log(evaluateResult(ann.run(flatImages[i])), labels[i]);
  }
})
  .catch(console.log);


