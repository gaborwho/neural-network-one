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
  return _.indexOf(resultVector, _.max(resultVector));
}

co(function*() {
  const images = loadDatabase('mnist/train-images-idx3-ubyte');
  const labels = loadDatabase('mnist/train-labels-idx1-ubyte');
  console.log('read database');

  const flatImages = images.map(_.flatten);
  console.log('flattened');

  const testImages = loadDatabase('mnist/t10k-images-idx3-ubyte');
  const flatTestImages = testImages.map(_.flatten);
  const testLabels = loadDatabase('mnist/t10k-labels-idx1-ubyte');

  const dataset = flatImages.map((image, index) => ({ input: image, output: unitVector(10, labels[index]) }));

  console.log('created dataset');

  const ann = fanny.createANN({
    layers: [ flatImages[0].length, 30, 10 ],
    activationFunctions: {
        hidden: 'SIGMOID',
        output: 'SIGMOID'
    },
  });

  //ann.setOption('learningRate', 1.3);
  //ann.setOption('learningMomentum', 0.9);

  const trainingData = fanny.createTrainingData(dataset);

  ann.setOption('trainingAlgorithm', 'RPROP');
  console.log('start training');
  console.time('train');
  yield ann.train(trainingData, { maxEpochs: 300, desiredError: 0.02 }, console.log)
  console.timeEnd('train');
  console.log('trained');

  for (let i = 0; i < 10; i++) {
    console.log(evaluateResult(ann.run(flatTestImages[i])), testLabels[i]);
  }

  for (let i = 0; i < 10; i++) {
    console.log(evaluateResult(ann.run(flatImages[i])), labels[i]);
  }

  const numberOfSuccessful = flatTestImages.reduce(function(acc, image, index) {
    const guess = evaluateResult(ann.run(image));
    if (index % 1000 == 0) {
      console.log(index, guess, testLabels[index], guess == testLabels[index]);
    }

    if (guess == testLabels[index]) {
      acc++;
    }
    return acc;
  }, 0);
  const successRate = numberOfSuccessful / flatTestImages.length;

  console.log(`Successful: ${numberOfSuccessful}`);
  console.log(`Success rate: ${successRate}`);
})
  .catch(console.log);


