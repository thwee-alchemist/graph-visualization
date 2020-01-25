    // setup observer
    var config = {
      attributes: false,
      childList: true,
      subtree: true
    };

    var self = this;
    var moCallback = function(mutations, observer){
      for(var mutation of mutations){
        switch(mutation.type){
          case 'childList':
            console.log('child added or removed', mutation);

            for(var added of mutation.addedNodes){
              console.log('added: ', added);
            }

            for(var removed of mutation.removedNodes){
              console.log('removed', removed);
            }
            break;

          case 'attributes':
            console.log('attribute changed', mutation)
        }
      }
    }

    this.observer = new MutationObserver(moCallback);
    this.observer.observe(this, config);

    this.ro = new ResizeObserver(entries => {
      for(var entry of entries){
        console.log('observing the canvas:', entry);
        this.setAttribute('width', entry.contentRect.width);
        this.setAttribute('height', entry.contentRect.height)
      }
    });

    this.ro.observe(this);

    Scene, AmbientLight, WebGLRenderer, PerspectiveCamera, TextureLoader, Raycaster, Vector2, BoxGeometry, MeshBasicMaterial, Mesh, LineBasicMaterial, BufferGeometry, BufferAttribute, Line


    /*

    dynamic-graph.cpp
7#ifndef DYNAMIC_GRAPH
#define DYNAMIC_GRAPH

#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>

#include "Settings.h"
#include "Vertex.h"
#include "Edge.h"
#include "BarnesHutNode3.h"
#include "LayoutGraph.h"

using namespace sc;
using namespace emscripten;

Settings* default_settings(){
  float _repulsion = 20;
  float _epsilon = 1e-4;
  float _inner_distance = 5e3;
  float _attraction = 4e1;
  float _friction = 8e-1;
  float _gravity = 1e1;
  float _time_dilation = 0.1;
  float _dampening = 0.1;

  return new Settings(
    _attraction,
    _repulsion, 
    _epsilon
    _inner_distance,
    _friction,
    _gravity,
    _time_dilation
    _dampening
  );
}

EMSCRIPTEN_BINDINGS(fourd){
  emscripten::class_<Settings>("Settings")
    .constructor<double, double, double, double, double, double, double, double>()
    .property("repulsion", &Settings::get_repulsion, &Settings::set_repulsion)
    .property("epsilon", &Settings::get_epsilon, &Settings::set_epsilon)
    .property("inner_distance", &Settings::get_inner_distance, &Settings::set_inner_distance)
    .property("attraction", &Settings::get_attraction, &Settings::set_attraction)
    .property("friction", &Settings::get_friction, &Settings::set_friction)
    .property("gravity", &Settings::get_gravity, &Settings::set_gravity)
    .property("time_dilation", &Settings::get_time_dilation, &Settings::set_time_dilation)
    .property("dampening", &Settings::get_dampening, &Settings:set_dampening);
  emscripten::function("default_settings", &default_settings, allow_raw_pointers());
  emscripten::class_<LayoutGraph>("LayoutGraph")
    .constructor<Settings*, int, LayoutGraph*>()
    .function("add_vertex", &LayoutGraph::add_vertex)
    .function("add_edge", &LayoutGraph::add_edge)
    .function("remove_vertex", &LayoutGraph::remove_vertex)
    .function("remove_edge", &LayoutGraph::remove_edge)
    .function("layout", &LayoutGraph::layout)
    .function("get_center", &LayoutGraph::get_center)
    .function("clear", &LayoutGraph::clear);
}
#endif

#endif

    */