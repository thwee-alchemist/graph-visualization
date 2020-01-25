#ifndef FOURD
#define FOURD

#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
#include <emscripten.h>

#include "Settings.h"
#include "Vertex.h"
#include "Edge.h"
#include "BarnesHutNode3.h"
#include "LayoutGraph.h"
#include "DynamicMatching.h"

using namespace sc;
using namespace emscripten;

Settings* default_settings(){
  double _attraction = 1e-2;
  double _repulsion = 1e-2;
  double _epsilon = 1e-4;
  double _inner_distance = 9e-3;
  double _friction = 8e-1;
  double _gravity = 1e1;
  double _time_dilation = 0.1;
  double _dampening = 0.1;

  return new Settings(
    _attraction,
    _repulsion, 
    _epsilon, 
    _inner_distance,
    _friction,
    _gravity,
    _time_dilation,
    _dampening
  );
};

EMSCRIPTEN_KEEPALIVE
EMSCRIPTEN_BINDINGS(fourd){
  emscripten::class_<Settings>("Settings")
    .constructor<double, double, double, double, double, double, double, double>()
    .property("attraction", &Settings::get_attraction, &Settings::set_attraction)
    .property("repulsion", &Settings::get_repulsion, &Settings::set_repulsion)
    .property("epsilon", &Settings::get_epsilon, &Settings::set_epsilon)
    .property("inner_distance", &Settings::get_inner_distance, &Settings::set_inner_distance)
    .property("friction", &Settings::get_friction, &Settings::set_friction)
    .property("gravity", &Settings::get_gravity, &Settings::set_gravity)
    .property("time_dilation", &Settings::get_time_dilation, &Settings::set_time_dilation)
    .property("dampening", &Settings::get_dampening, &Settings::set_dampening);
  emscripten::function("default_settings", &default_settings, allow_raw_pointers());
  emscripten::class_<LayoutGraph>("LayoutGraph")
    .constructor<Settings*, int>()
    .function("add_vertex", &LayoutGraph::add_vertex)
    .function("add_edge", &LayoutGraph::add_edge)
    .function("remove_vertex", &LayoutGraph::remove_vertex)
    .function("remove_edge", &LayoutGraph::remove_edge)
    .function("layout", &LayoutGraph::layout)
    .function("get_center", &LayoutGraph::get_center)
    .function("get_vertices", &LayoutGraph::get_vertices)
    .function("get_edges", &LayoutGraph::get_edges)
    .function("clear", &LayoutGraph::clear)
    .function("toJSON", &LayoutGraph::toJSON);
}
#endif

#endif
