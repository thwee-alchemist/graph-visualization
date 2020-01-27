var App = angular.module('App', []);

var AppCtrl = App.controller('AppCtrl', ['$scope', async function($scope){
  $scope.output = "Nothing yet";
  
  $scope.graph = document.querySelector('graph-visualization');
  /*
  $scope.settings = {
    attraction     : 4e-1,
    repulsion      : 1e-2,
    epsilon        : 1e-3,
    inner_distance : 9e-3,
    time_dilation  : 0.1,
    friction       : 8e-1,
    gravity        : 1e-1,
    dampening      : 1e-1,
    drag           : 1e-3,
    theta          : 0.25,
    spread         : 1e4
  };
  */

}]);
