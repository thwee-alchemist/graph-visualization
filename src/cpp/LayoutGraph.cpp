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
  /*
  if(V->find(source) == V->end() || V->find(target) == V->end()){
    return 0;
  }
  */
  Vertex* src = V->at(source);
  Vertex* tgt = V->at(target);

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
  Vertex* v = V->at(vertex_id);
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
  Edge* e = E->at(edge_id);

  if(e == NULL){
    std::cerr << "LG-" << id << "::remove_edge " << edge_id << ": id not found" << std::endl;
    return false;
  }

  if(dm != NULL){
    dm->remove_edge(e);
  }

  E->erase(e->id);
  delete e;

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
    auto vs = vertices();

    Eigen::MatrixXd friction = Eigen::MatrixXd(1, 3);
    for(auto id : vs){
      Vertex* v = V->at(id);

      friction = *v->velocity * settings->friction;
      *v->acceleration -= friction;
      *v->velocity += *v->acceleration;
      *v->position += *v->velocity;
    }

    return toJSON(false);
  }

  dm->coarser->layout();
  two_level_dynamics();

  return toJSON(false);
}

Eigen::MatrixXd LayoutGraph::alpha__(){
  
  Eigen::MatrixXd sum = Eigen::MatrixXd(3, 3);
  sum.setZero();
  
  if((V->size() == 0) || (dm->coarser->V->size() == 0)){
    return sum;
  }

  auto vs = vertices();
  Vertex* v;
  Vertex* y;

  Eigen::MatrixXd part1 = Eigen::MatrixXd(1, 3);
  Eigen::MatrixXd part2 = Eigen::MatrixXd(1, 3);
  Eigen::MatrixXd partialSum = Eigen::MatrixXd(3, 3);

  for(auto id : vs){
    v = V->at(id);
    y = dm->get_corresponding_vertex(v);

    if(y == NULL){
      continue;
    }

    part1 = (y->position->transpose()) * (*v->displacement);
    part2 = (v->displacement->transpose()) * (*y->position);

    partialSum = part1 + part2;
    sum += partialSum;
  }

  Eigen::MatrixXd a__ = Eigen::MatrixXd(3, 3);
  if(dm->coarser->V->size() != 0){
    a__ = sum / (dm->coarser->V->size());
  }else{
    a__.setZero();
  }

  a__ -= settings->dampening * alpha_;

  alpha_ += a__;
  alpha += alpha_;

  return a__;
}

Eigen::MatrixXd LayoutGraph::beta__(){

  Eigen::MatrixXd sum = Eigen::MatrixXd(1, 3); // Thanks, Natalie!
  sum.setZero();

  if((V->size() == 0) || (dm->coarser->V->size() == 0)){
    return sum;
  }

  auto vs = vertices();

  Vertex* v;
  for(auto id : vs){
    v = V->at(id);
    sum += *v->displacement;
  }

  Eigen::MatrixXd b__ = sum / ((double)dm->coarser->V->size());

  b__ -= settings->dampening * beta_;

  beta_ += b__;
  beta += beta_;

  return b__;
}

void LayoutGraph::two_level_dynamics(){
  auto a__ = alpha__();
  auto b__ = beta__();

  Vertex* v;
  Vertex* y;
  Eigen::MatrixXd proj_accel;
  Eigen::MatrixXd d__;

  Eigen::MatrixXd sum = Eigen::MatrixXd(1, 3);
  Eigen::MatrixXd Fi = Eigen::MatrixXd(1, 3);

  auto vs = vertices();
  for(auto vid : vs){

    sum.setZero();
    
    v = V->at(vid);
    y = dm->get_corresponding_vertex(v);
    if(y == NULL){
      continue;
    }
    sum += b__;
    sum += (*y->position) * a__;
    sum += (*y->velocity) * (alpha_ * 2 * settings->theta);
    sum += ((*y->acceleration) * alpha * ((settings->theta)*(settings->theta)));
    *v->proj_accel = sum;
  }

  single_level_dynamics();

  for(auto id : vs){
    Vertex* v = V->at(id);
    *v->displacement__ = *v->acceleration - *v->proj_accel;
    *v->displacement_ += *v->displacement__;
    *v->displacement += *v->displacement_;

    *v->acceleration = *v->displacement__ + *v->proj_accel;
    *v->velocity += *v->acceleration;
    *v->position += *v->velocity;
  }
}

/**
 * Applicable if this is the coarsest graph
 */
void LayoutGraph::single_level_dynamics(){
  BarnesHutNode3* tree = new BarnesHutNode3(*settings);
  auto vs = vertices();

  for(auto id : vs){
    auto v = V->at(id);
    v->acceleration->setZero();

    tree->insert(v);
  }

  double c_attraction = settings->attraction;
  // double c_attraction_friction = settings->attraction_friction;

  // repulsion
  for(auto idi : vs){
    Vertex* vi = V->at(idi);
    
    // friction = *vi->velocity * c_friction;
    *vi->acceleration = tree->estimate(vi, Vertex::pairwise_repulsion); //  - friction;

    // std::cout << "repulsion " << idi << " " << *vi->acceleration << std::endl;
  }

  Eigen::MatrixXd xi = Eigen::MatrixXd(1, 3);
  Eigen::MatrixXd xj = Eigen::MatrixXd(1, 3);

  // Eigen::MatrixXd source_friction = Eigen::MatrixXd(1, 3);;
  // Eigen::MatrixXd target_friction = Eigen::MatrixXd(1, 3);;

  Eigen::MatrixXd attraction = Eigen::MatrixXd(1, 3);;

  // attractions
  auto es = edges();
  for(auto id : es){
    auto e = E->at(id);

    xi = *e->source->position;
    xj = *e->target->position;

    attraction = ((xi - xj) * -1 * settings->attraction);

    *(e->source->acceleration) += attraction;
    *(e->target->acceleration) -= attraction;

    // std::cout << "final force" << e->target->acceleration->norm() << std::endl;
  }

  double c_friction = settings->friction;
  Eigen::MatrixXd friction = Eigen::MatrixXd(1, 3);

  for(auto id : vs){
    auto v = V->at(id);

    friction = *v->velocity * settings->friction;
    *v->acceleration -= friction;
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
  stream << "{\"V\": [";
  
  auto vs = vertices();
  for(auto it : vs){
    stream << V->at(it)->toJSON();
    if(i++ < ((vs.size())-1)){
      stream << ",";
    }
  }

  stream << "]}";

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
