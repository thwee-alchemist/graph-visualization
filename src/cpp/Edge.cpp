#include <sstream>
#include "Vertex.h"
#include "Edge.h"

#include <iostream>
#include <cassert>
#include <random>

using namespace sc;

Edge::Edge(unsigned int _id, Vertex* _source, Vertex* _target, bool _directed, double _strength, LayoutGraph* _graph){
  assert(_source != _target);

  // https://stackoverflow.com/a/9324796/11169288
  static std::uniform_real_distribution<double> unif(-100.0, 100.0);
  static std::default_random_engine re;
  
  id = _id;
  graph = _graph;
  directed = _directed;
  strength = _strength;

  source = _source;
  source->edges->emplace(id, this);

  target = _target;
  target->edges->emplace(id, this);


  coarser = NULL;
  order = unif(re);
  count = 1;
}

std::string Edge::toJSON(){
  std::stringstream ss;
  ss << "{\"id\":" << id 
  << ",\"order\":" << order
  << ",\"source\":" << source->id 
  << ",\"target\":" << target->id 
  << ",\"directed\":" << directed  
  << ",\"strength\": " << strength
  << ",\"count\":" << count 
  << "}";
  return ss.str();
}

bool Edge::operator==(const Edge& other){
  return id == other.id;
}

bool Edge::depends(const Edge* other){
  return (order < other->order) && ((source == other->source) || (source == other->target) || (target == other->source) || (target == other->target));
}

Eigen::MatrixXd Edge::attraction(Settings& settings){
  Eigen::MatrixXd a = (*source->position - *target->position) * (-1.0 * settings.attraction) * strength;
  if(directed){
    double distance = (*source->position - *target->position).norm();
    Eigen::MatrixXd gravity(1, 3);
    gravity << 0, settings.gravity, 0;
    a += gravity * distance * strength;
  }
  
  return a;
}

Edge::~Edge(){
  /*
  source->edges->erase(id);
  target->edges->erase(id);
  */
}

bool Edge::shares_vertex_with(Edge* e){
  return (source->id == e->source->id || source->id == e->target->id || target->id == e->source->id || target->id == e->target->id);
}

bool Edge::depends(Edge* e){
  return (order < e->order) && shares_vertex_with(e);
}