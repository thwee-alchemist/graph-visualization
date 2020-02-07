var App = angular.module('App', []);

var randomSetting = function(){
  var base = Math.floor(Math.random() * 10)
  var exp = Math.floor(Math.random() * 6);
  var sign = Math.random() < 0.5 ? -1 : 1; 
  var expSign = Math.random() < 0.5 ? -1 : 1;

  var number = parseFloat(`${sign * base}e${exp * expSign}`);
  return number
}


function getEdgeLengths(){
  var graph = document.querySelector('graph-visualization');
  var edges = graph.querySelectorAll('graph-edge');
  var lengths = [];
  for(var i=0; i<edges.length; i++){
    var edge = edges[i];
    var xi = document.querySelector(edge.source).cube.position;
    var xj = document.querySelector(edge.target).cube.position;

    var l = xi.distanceTo(xj);
    lengths.push(l);
  }
  return lengths;
}

async function getSettings(){
  var graph = document.querySelector('graph-visualization');
  var s = graph.layout.settings;

  return new Promise((resolve, reject) => {
    Promise.all([s.attraction, s.repulsion, s.epsilon, s.inner_distance, s.friction, s.dampening, s.theta]).then(ps => {
      resolve({
        settings: {
          'attraction': ps[0],
          'repulsion': ps[1],
          'epsilon': ps[2],
          'inner_distance': ps[3],
          'friction': ps[4],
          'dampening': ps[5],
          'theta': ps[6]
        },
        lengths: getEdgeLengths()
      })
    })
  })
}

var AppCtrl = App.controller('AppCtrl', ['$scope', async function($scope){
  $scope.output = "Nothing yet";

  var settings = ['attraction', 'repulsion', 'epsilon', 'inner_distance', 'friction', 'dampening'];

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
    // context.fillStyle = 'white';
    // context.fillRect(0, 0, canvas.width, canvas.height)

    rc.rectangle(0, 0, 100, 100, {
      fill: getRandomColor(),
      hachureAngle: 60, // angle of hachure,
      hachureGap: 8,
      roughness: 2.8
    });

    return rc.canvas.toDataURL();
  }


  $scope.i = 0;
  $scope.addVertex = function(){
    var vertex = document.createElement('graph-vertex');
    vertex.id = `id-${$scope.i++}`;
    vertex.face = drawCube();
    vertex.size = 1;

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
  $scope.constructPyramid = () => {
    var graph = document.querySelector('graph-visualization');
    var pid = pyramidId++;

    var makeVertex = function(id, pid){
      var vertex = document.createElement('graph-vertex');
      vertex.id = id + '-' + pid;
      vertex.size = 1;
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
