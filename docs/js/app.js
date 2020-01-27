var App = angular.module('App', []);

var AppCtrl = App.controller('AppCtrl', ['$scope', async function($scope){
  $scope.output = "Nothing yet";
  
  $scope.graph = document.querySelector('graph-visualization');
  var range = function(n){
    var arr = [];
    for(var i=0; i<n; i++){
      arr.push(i);
    }

    return arr;
  }

  $scope.i = 0;
  $scope.addVertex = function add_vertex(){
    var vertex = document.createElement('graph-vertex');
    vertex.id = `id-${$scope.i++}`;
    vertex.face = randomColor();
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
    var n = parseInt(prompt('How many? ', 100));
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

    var edge = document.createElement('graph-edge');
    edge.color = 'black';
    edge.source = source;
    edge.target = target;

    $scope.graph.appendChild(edge);
  }

  $scope.addEdges = function(){
    var n = parseInt(prompt('How many edges?', 100));
    var i = 0; 
    var t = setInterval(function(){
      $scope.addEdge();
      if(i++ >= n){
        clearInterval(t);
      }
    }, 100)
  }

}]);
