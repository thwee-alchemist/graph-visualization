#include <exception>
#include <map>
#include <queue>
#include <set>
#include "Vertex.h"
#include "Edge.h"
#include "BarnesHutNode3.h"
#include "LayoutGraph.h"
#include "eigen/Eigen/Dense"
#include "eigen/Eigen/Geometry"

#include <iostream>
#include <exception>
#include <cassert>
#include <math.h>

using namespace sc;

bool EdgeOrder::operator()(const Edge* one, const Edge* two){ 
  return one->order < two->order; 
}

bool VertexOrder::operator()(const Vertex* one, const Vertex* two){
  return one->id - two->id;
}

LayoutGraph::LayoutGraph(Settings* _settings, int levels){
  id = levels;

  vertex_spawn = 0;
  edge_spawn = 0;
  V = new std::map<unsigned int, Vertex*>();
  E = new std::map<unsigned int, Edge*>();

  settings = _settings;
  if(levels > 0){
    dm = new DynamicMatching(this, levels-1);
  }else{
    dm = NULL;
  }

  alpha = Eigen::MatrixXd(3, 3);
  alpha.setZero();

  alpha_ = Eigen::MatrixXd(3, 3);
  alpha_.setZero();

  beta = Eigen::MatrixXd(1, 3);
  beta.setZero();

  beta_ = Eigen::MatrixXd(1, 3);
  beta_.setZero();
}

LayoutGraph::~LayoutGraph(){
  vertex_spawn = 0;
  edge_spawn = 0;

  unsigned int size = V->size();
  unsigned int vertices[size];

  unsigned int i=0;
  for(auto it : *V){
    vertices[i++] = it.first;
  }

  for(unsigned int j=0; j<size; j++){
    remove_vertex(vertices[j]);
  }

  delete E;
  delete V;
  delete dm; 
}

unsigned int LayoutGraph::add_vertex(){
  Vertex* vertex = new Vertex(++vertex_spawn, this);
  V->emplace(vertex->id, vertex);

  if(dm != NULL){
    dm->add_vertex(vertex);
  }
  
  return vertex->id;
}

unsigned int LayoutGraph::add_edge(unsigned int source, unsigned int target, bool directed, double strength){
  if(V->find(source) == V->end() || V->find(target) == V->end()){
    return 0;
  }
  Vertex* src = (*V).at(source);
  Vertex* tgt = (*V).at(target);

  if(src == NULL || tgt == NULL){
    return 0;
  }

  unsigned int id = ++edge_spawn;
  Edge* edge = new Edge(id, src, tgt, directed, strength, this);
  E->emplace(id, edge);

  if(dm != NULL){
    dm->add_edge(edge);
  }

  return id;
}

bool LayoutGraph::remove_vertex(unsigned int vertex_id){
  Vertex* v = (*V)[vertex_id];
  if(v == NULL){
    return false;
  }

  for(auto id : incident_edges(v)){
    remove_edge(id);
  }

  if(dm != NULL){
    dm->remove_vertex(v);
  }

  V->erase(vertex_id);

  delete v;

  return true;
}

bool LayoutGraph::remove_edge(unsigned int edge_id){
  if(E->find(edge_id) == E->end()){
    return false;
  }
  Edge* e = (*E)[edge_id];

  if(e == NULL){
    std::cerr << "LG-" << id << "::remove_edge " << edge_id << ": id not found" << std::endl;
    return false;
  }

  if(dm != NULL){
    dm->remove_edge(e);
  }

  E->erase(e->id);
  delete e;
  e = NULL;

  return true;
}

bool LayoutGraph::clear(){
  vertex_spawn = 0;
  edge_spawn = 0;

  if(dm != NULL){
    dm->clear();
  }
  E->clear();
  V->clear();

  return true;
}

Eigen::MatrixXd LayoutGraph::checkNan(Eigen::MatrixXd potential, Eigen::MatrixXd otherwise){
  auto arr = potential.array();
  if((isnan(arr).any() || isinf(arr).any())){
    return otherwise;
  }else{
    return potential;
  }
}

/**
 * string layout()
 * 
 * Returns a json string with the updated positions for all vertices in the 
 * coarsest graph of the Dynamic Matching. 
 */
std::string LayoutGraph::layout(){
  if(dm == NULL){
    single_level_dynamics();
    return toJSON(false);
  }

  dm->coarser->layout();

  two_level_dynamics();

  Vertex* v;
  for(auto id : vertices()){
    v = V->at(id);

    *v->velocity += *v->acceleration;
    *v->position += *v->velocity;
    *v->position *= settings->spread;
  }

  return toJSON(false);
}

Eigen::MatrixXd LayoutGraph::alpha__(){
  
  Eigen::MatrixXd sum = Eigen::MatrixXd(3, 3); // Thanks Natalie!
  sum.setZero();
  
  if(V->size() == 0){
    return sum;
  }

  Vertex* v;
  Vertex* y;
  for(auto id : vertices()){
    v = V->at(id);
    y = v->coarser;
    if(y != NULL){
      sum += (*v->velocity * y->position->transpose()) + (*y->position * v->velocity->transpose());
    }
  }

  Eigen::MatrixXd a__ = sum / (V->size());

  alpha_ += a__;
  alpha += alpha_;

  return a__;
}

Eigen::MatrixXd LayoutGraph::beta__(){

  Eigen::MatrixXd sum = Eigen::MatrixXd(1, 3); // Thanks, Natalie!
  sum.setZero();

  if(V->size() == 0){
    return sum;
  }

  auto vs = vertices();

  Vertex* v;
  for(auto id : vs){
    v = V->at(id);
    sum += *v->velocity;
  }

  Eigen::MatrixXd b__ = sum / (V->size());
  beta_ += b__;
  beta += beta_;

  return b__;
}

void LayoutGraph::two_level_dynamics(){
  auto a__ = alpha__();
  auto b__ = beta__();

  Eigen::MatrixXd sum = Eigen::MatrixXd(1, 3);
  sum.setZero();

  Vertex* v;
  Vertex* y;
  Eigen::MatrixXd proj_accel;
  Eigen::MatrixXd d__;

  auto vs = vertices();
  for(auto vid : vs){
    v = V->at(vid);
    y = v->coarser;

    if(y != NULL){
      sum += b__;
      sum += (a__ * (*y->position));
      sum += (2 * alpha_ * settings->theta * (*y->velocity));
      sum += (alpha * (*y->acceleration) * (settings->theta)*(settings->theta));
      proj_accel = sum;

      d__ = *y->acceleration - proj_accel;
      *v->acceleration = d__ + proj_accel;
    }else{
      v->acceleration->setZero();
    }

    *v->acceleration -= *v->velocity * settings->drag;
  }
}

/**
 * Applicable if this is the coarsest graph
 */
void LayoutGraph::single_level_dynamics(){
  auto vs = vertices();

  BarnesHutNode3* tree = new BarnesHutNode3(*settings);
  for(auto id : vs){
    auto v = V->at(id);
    tree->insert(v);
  }

  Eigen::MatrixXd spring_forces = Eigen::MatrixXd(1, 3);
  spring_forces.setZero();

  Eigen::MatrixXd repulsion_forces = Eigen::MatrixXd(1, 3);
  repulsion_forces.setZero();

  for(auto idi : vs){

    Vertex* vi = V->at(idi);
    Eigen::MatrixXd xi = *vi->position;

    vi->acceleration->setZero();
    *vi->acceleration = tree->estimate(vi, Vertex::pairwise_repulsion);
  }

  double dampening = settings->dampening;
  double attraction = settings->attraction;

  auto es = edges();
  for(auto id : es){
    auto e = E->at(id);

    Eigen::MatrixXd xi = *e->source->position;
    Eigen::MatrixXd xj = *e->target->position;

    auto force = ((xi - xj) * -attraction) * dampening;

    *e->source->acceleration += force;
    *e->target->acceleration -= force;
  }

  for(auto id : vs){
    Vertex* v = V->at(id);

    *v->acceleration -= (*v->velocity * dampening);

    *v->velocity += *v->acceleration;
    *v->position += *v->velocity;
  }

  delete tree;
}

std::string LayoutGraph::get_center(){
  std::stringstream stream;

  stream << "{\"x\":" << center(0) << ",\"y\":" << center(1) << ",\"z\":" << center(2) << "}";
  return stream.str();
}

std::string LayoutGraph::toJSON(bool recursive){
  std::stringstream stream;
  unsigned int i = 0;

  /*
  stream << "{";
  stream << "\"settings\":{";
  stream << "\"attraction\":" << settings->attraction;
  stream << ",\"repulsion\":" << settings->repulsion;
  stream << ",\"inner_distance\":" << settings->inner_distance;
  stream << ",\"time_dilation\":" << settings->time_dilation;
  stream << ",\"friction\":" << settings->friction;
  stream << ",\"gravity\":" << settings->gravity;
  stream << "}";
  stream << ",\"V\":[";
  */

  stream << "{\"V\": [";
  
  std::vector<unsigned int> vs = vertices();
  for(auto it : vs){
    stream << V->at(it)->toJSON();
    if(i++ < ((vs.size())-1)){
      stream << ",";
    }
  }

  stream << "]}";

  /*
  stream<< "],";
  stream << "\"E\":[";
  i = 0;
  auto es = edges();
  for(auto it : es){
    stream << E->at(it)->toJSON();
    if(i++ < ((es.size())-1)){
      stream << ",";
    }
  }
  stream << "],\"DM\":";
  stream << (dm != NULL ? dm->toJSON() : "null");

  stream << "}";
  */

  return stream.str();
}

std::vector<unsigned int> LayoutGraph::incident_edges(Vertex* vertex){
  std::vector<unsigned int> n;
  if(vertex == NULL){
    return n;
  }

  auto es = edges();
  Edge* e;
  for(auto it : es){
    e = E->at(it);
    if(e != NULL && (
      ((e->source != NULL) && (e->source->id == vertex->id)
      || (e->target != NULL) && (e->target->id == vertex->id)))){
      n.push_back(it);
    }
  }
  
  return n;
}

std::vector<unsigned int> LayoutGraph::edges(){
  std::vector<unsigned int> es;

  for(auto it : *E){
    if(it.second != NULL){
      es.push_back(it.first);
    }
  }

  return es;
}

std::vector<unsigned int> LayoutGraph::vertices(){
  std::vector<unsigned int> vs;

  for(auto it : *V){
    if(it.second != NULL){
      vs.push_back(it.first);
    }
  }

  return vs;
}

std::string LayoutGraph::get_vertices(){
  auto vs = vertices();
  std::stringstream stream;
  stream << "[";
  unsigned int i = 0;
  for(auto id : vs){
    stream << id;
    if(i<vs.size()-1){
      stream << ",";
    }
    i++;
  }

  stream << "]";

  return stream.str();
}

std::string LayoutGraph::get_edges(){
  auto es = edges();
  std::stringstream stream;
  stream << "[";
  unsigned int i = 0;
  for(auto id : es){
    stream << id;
    if(i<es.size()-1){
      stream << ",";
    }
    i++;
  }
  stream << "]";

  return stream.str();
}
