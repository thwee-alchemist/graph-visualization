var App = angular.module('App', []);


async function getSettings(){
  var graph = document.querySelector('graph-visualization');
  var s = graph.layout.settings;

  return new Promise((resolve, reject) => {
    Promise.all([s.attraction, s.repulsion, s.epsilon, s.inner_distance, s.friction, s.dampening]).then(ps => {
      resolve({
        'attraction': ps[0],
        'repulsion': ps[1],
        'epsilon': ps[2],
        'inner_distance': ps[3],
        'friction': ps[4],
        'dampening': ps[5]
      })
    })
  })
}

function getEdgeLengths(){
  var graph = document.querySelector('graph-visualization');
  var edges = graph.querySelectorAll('graph-edge');
  if(edges instanceof Array){
    return edges.map(edge => {
      var xi = document.querySelector(edge.source).cube.position;
      var xj = document.querySelector(edge.target).cube.position;

      var l = xi.distanceTo(xj);
      return l;
    });
  }else{
    window.recording = false;
    return [];
  }
}

var AppCtrl = App.controller('AppCtrl', ['$scope', async function($scope){
  $scope.output = "Nothing yet";

  window.settings = [];
  window.lengths = [];

  async function getData() {
    window.enough = new Promise((resolve, reject) => {
      window.recording = true;
      var it = setInterval(() => {
        if(!window.recording){
          window.recording = false;
          resolve(window.lengths);
          clearInterval(it);
        }else{
          count++;

          window.lengths.push( getEdgeLengths() );
          window.settings.push( await getSettings() );
        }
      }, 10)
    });

    await window.enough;
    console.log('done', lengths.length)
    var settings = window.settings;
    console.log('lengths', lengths)
    console.log('settings', settings);

    var cleaned = lengths.map((l, i) => {

      var s = settings[i];
      if(s){
        var fs = [s.attraction, s.repulsion, s.epsilon, s.inner_distance, s.friction, s.dampening];
        
        // lengths
        return {settings: fs, lengths: l};
      }else{
        return {settings: null, lengths: null}
      }
    }).filter(d => d.settings && d.lengths)

    return cleaned;
  }

  function createModel() {
    // Create a sequential model
    const model = tf.sequential(); 
    
    // Add a single hidden layer
    model.add(tf.layers.dense({inputShape: [6], units: 1, useBias: true}));
    
    // Add an output layer
    model.add(tf.layers.dense({ units: 6, useBias: true}));
  
    return model;
  }

  $scope.run = async function() {
    // Load and plot the original input data that we are going to train on.
    recording = true;
    $scope.construct();
    const data = await getData();

    console.log('data', data);

    var input = tf.tensor(data.map(d => d.settings));
    console.log('shape', input.shape);
  
    // More code will be added below

    /*
    const model = createModel();  
    tfvis.show.modelSummary({name: 'Model Summary'}, model);

    const tensorData = convertToTensor(data);
    const {inputs, labels} = tensorData;
        
    // Train the model  
    await trainModel(model, inputs, labels);
    console.log('Done Training');
    */
  }

    /**
   * Convert the input data to tensors that we can use for machine 
   * learning. We will also do the important best practices of _shuffling_
   * the data and _normalizing_ the data
   * MPG on the y-axis.
   */
  function convertToTensor(data) {
    // Wrapping these calculations in a tidy will dispose any 
    // intermediate tensors.
    
    return tf.tidy(() => {
      // Step 1. Shuffle the data    
      tf.util.shuffle(data);

      // Step 2. Convert data to Tensor
      const inputs = data.map(d => {
        return d.settings;
      })
      const labels = data.map(d => {
        return d.lengths;
      });

      console.log('inputs: ', inputs, 'labels: ', labels)

      const inputTensor = tf.tensor2d(inputs, [inputs.length, 6]);
      const labelTensor = tf.tensor2d(labels, [labels.length, 10]);

      //Step 3. Normalize the data to the range 0 - 1 using min-max scaling
      const inputMax = inputTensor.max();
      const inputMin = inputTensor.min();  
      const labelMax = labelTensor.max();
      const labelMin = labelTensor.min();

      const normalizedInputs = inputTensor.sub(inputMin).div(inputMax.sub(inputMin));
      const normalizedLabels = labelTensor.sub(labelMin).div(labelMax.sub(labelMin));

      return {
        inputs: normalizedInputs,
        labels: normalizedLabels,
        // Return the min/max bounds so we can use them later.
        inputMax,
        inputMin,
        labelMax,
        labelMin,
      }
    });  
  }

  async function trainModel(model, inputs, labels) {
    // Prepare the model for training.  
    model.compile({
      optimizer: tf.train.adam(),
      loss: tf.losses.meanSquaredError,
      metrics: ['mse'],
    });
    
    const batchSize = 32;
    const epochs = 50;
    
    return await model.fit(inputs, labels, {
      batchSize,
      epochs,
      shuffle: true,
      callbacks: tfvis.show.fitCallbacks(
        { name: 'Training Performance' },
        ['loss', 'mse'], 
        { height: 200, callbacks: ['onEpochEnd'] }
      )
    });
  }
  

  /* END OF TENSORFLOW STUFF */

  $scope.graph = document.querySelector('graph-visualization');
  var range = function(n){
    var arr = [];
    for(var i=0; i<n; i++){
      arr.push(i);
    }

    return arr;
  }

  var canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  var rc = rough.canvas(canvas);

  var context = canvas.getContext('2d')

  var drawCube = function(){
    context.clearRect(0, 0, canvas.width, canvas.height);

    rc.rectangle(0, 0, 100, 100, {
      fill: getRandomColor(),
      hachureAngle: 60, // angle of hachure,
      hachureGap: 8
    });

    return rc.canvas.toDataURL();
  }


  $scope.i = 0;
  $scope.addVertex = function add_vertex(){
    var vertex = document.createElement('graph-vertex');
    vertex.id = `id-${$scope.i++}`;
    vertex.face = drawCube();
    vertex.size = 5;

    $scope.graph.appendChild(vertex)

    vertex.onclick = function(e){
      select(e.target);
    }

    vertex.ondblclick = function(e){
      centerAround(e.target);
    }
  }

  $scope.addVertices = function(){
    var n = parseInt(prompt('How many? ', 10));
    var i = 0; 
    var t = setInterval(function(){
      $scope.addVertex();
      if(i++ >= n){
        clearInterval(t);
      }
    }, 100)
  }

  $scope.addEdge = function(){
    var vertices = $scope.graph.querySelectorAll('graph-vertex');
    var l = vertices.length;
    var source = `#id-${Math.round(Math.random() * l)}`;
    var target = `#id-${Math.round(Math.random() * l)}`;

    if($scope.graph.querySelector(source) && $scope.graph.querySelector(target)){   
      var edge = document.createElement('graph-edge');
      edge.color = 'black';
      edge.source = source;
      edge.target = target;

      $scope.graph.appendChild(edge);
    }
  }

  $scope.addEdges = function(){
    var n = parseInt(prompt('How many edges?', 10));
    var i = 0; 
    var t = setInterval(function(){
      $scope.addEdge();
      if(i++ >= n){
        clearInterval(t);
      }
    }, 100)
  }

  var pyramidId = 0;
  $scope.construct = async () => {
    var graph = document.querySelector('graph-visualization');
    var pid = pyramidId++;

    var makeVertex = function(id, pid){
      var vertex = document.createElement('graph-vertex');
      vertex.id = id + '-' + pid;
      vertex.size = 5;
      vertex.face = drawCube();

      return vertex;
    };

    var makeEdge = function(source, target){
      var edge = document.createElement('graph-edge');
      edge.source = '#' + source.id;
      edge.target = '#' + target.id;
      
      return edge;
    }

    var wait = async function(t){
      return await new Promise((resolve, reject) => {
        setTimeout(resolve, t);
      })
    }

    var t = 100;
    var makePyramid = async function(pid){
      var one = makeVertex('one', pid);
      graph.appendChild(one);
      await wait(t);
      var two = makeVertex('two', pid);
      graph.appendChild(two);
      await wait(t);
      var three = makeVertex('three', pid);
      graph.appendChild(three);
      await wait(t);
      var four = makeVertex('four', pid);
      graph.appendChild(four);
      await wait(t);

      var e1 = makeEdge(one, two, pid);
      graph.appendChild(e1);
      await wait(t);
      var e2 = makeEdge(one, three, pid);
      graph.appendChild(e2)
      await wait(t);
      var e3 = makeEdge(one, four, pid);
      graph.appendChild(e3);
      await wait(t);
      var e4 = makeEdge(two, three, pid);
      graph.appendChild(e4);
      await wait(t);
      var e5 = makeEdge(two, four, pid);
      graph.appendChild(e5);
      await wait(t);
      var e6 = makeEdge(three, four, pid);
      graph.appendChild(e6);
    }

    makePyramid(pid);
  }

}]);
