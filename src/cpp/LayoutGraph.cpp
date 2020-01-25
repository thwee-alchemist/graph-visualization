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
}

/*
  This raises a question of taxonomy: What all belongs to it?
*/
LayoutGraph::LayoutGraph(const LayoutGraph& other){
   
   vertex_spawn = other.vertex_spawn;
   edge_spawn = other.edge_spawn;
   V = other.V;
   E = other.E;
   settings = other.settings;
   dm = other.dm; 
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
  // std::cout << "LG-" << id << "::add_vertex " << vertex_spawn + 1 << std::endl;
  Vertex* vertex = new Vertex(++vertex_spawn, this);
  V->emplace(vertex->id, vertex);

  if(dm != NULL){
    dm->add_vertex(vertex);
  }
  
  return vertex->id;
}

unsigned int LayoutGraph::add_edge(unsigned int source, unsigned int target, bool directed, double strength){
  // std::cout << "LG-" << id << "::add_edge " << edge_spawn + 1 << std::endl;
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
  // std::cout << "LG-" << id << "::remove_vertex " << vertex_id << std::endl; 
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
  // std::cout << "LG-" << id << "::remove_edge " << edge_id << std::endl; 
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

Eigen::MatrixXd LayoutGraph::alpha__(){
  Eigen::MatrixXd sum = Eigen::MatrixXd(3, 3);
  sum.setZero();

  Vertex* v;
  for(auto id : vertices()){
    v = (*V)[id];
    sum += (*v->displacement * v->position->transpose()) + (*v->position * v->displacement->transpose());
  }

  return sum * (1.0 / (V->size()));
}

Eigen::MatrixXd LayoutGraph::beta__(){
  Eigen::MatrixXd sum = Eigen::MatrixXd(1, 3);

  Vertex* v;
  for(auto id : vertices()){
    v = (*V)[id];
    sum += (*v->displacement);
  }

  return sum *= (1.0 / V->size());
}

/**
 * string layout()
 * 
 * Returns a json string with the updated positions for all vertices in the 
 * coarsest graph of the Dynamic Matching. 
 */
std::string LayoutGraph::layout(){
  /**
   * Conventions and Outline
   * 
   * x - position
   * x_ - velocity
   * x__ - acceleration
   * 
   * V - potential energy
   * V = Sum(for every pair (xi, xj) of E)(add (1/2)*K*abs(xi, xj)^2)
   *     + Sum(for every pair of distinct vertices (vi, vj))(add f0/(epsilon_R + abs(xi - xj)))
   * 
   * Equation (2)
   * T - kinetic energy
   * T = Sum(vi of E)((1/2)*abs(x_i)^2)
   * 
   * Equation (3)
   * L = T - V
   * 0 = L[d/dt*delta/(delta*x_i) - delta/(delta*xi)]
   * 
   * Equation (4) - Single Level Dynamics
   * x__i = (spring forces:)Sum(for every pair of vertices (vi, vj))(add -K*(xi - xj)))
   *        + (repulsion forces:)Sum(for every pair of distinct vertices (vi, vj, vi != vj))(add f0/(epsilon_R + abs(xi - xj)^2)*(xi - xj)/abs(xi - xj))
   *        + -d*x_i
   * 
   * Two-Level Dynamics:
   * 
   * di - some displacement
   * 
   * yi - coarse version of xi
   * 
   * Equation (5)
   * xi = di + alpha*yi + beta
   * 
   * Frame Dynamics:
   * 
   * Equation (6)
   * alpha__ = 1/n * Sum(i)(di*yi(^T) + yi*di(^T))
   * 
   * Equation (7)
   * beta__ = 1/n * Sum(i)(di)
   * 
   * -d_alpha * alpha_
   * -d_beta * beta_
   * 
   * Time Dilation:
   * 
   * Equation (8)
   * xi = di + beta + alpha*yi
   * 
   * Equation (9)
   * x_i = d_i + beta_ + alpha_*yi + alpha*yi
   * 
   * Equation (10)
   * x__i = d__i + beta__ + alpha__*yi + 2*alpha_*yi + alpha*y__i
   * 
   * Equation (11)
   * delta__i = Fi - (beta__ + alpha__*yi + 2*alpha_*y_i + alpha*y__i)
   * 
   * Equation (12)
   * xi(t) = d(t) + beta(t) + alpha(t)*yi*(omega*t)
   * 
   * Equation (13)
   * d__i = Fi - (beta__ + alpha__*yi + 2*alpha_*omega*y_i + alpha*y__i*omega^2)
   */

  single_level_dynamics();
  return toJSON(false);

}

/**
 * Applicable if this is the coarsest graph
 */
void LayoutGraph::single_level_dynamics(){
  auto vs = vertices();

  BarnesHutNode3* tree = new BarnesHutNode3(settings);
  for(auto id : vs){
    auto v = V->at(id);
    tree->insert(v);
  }

  Eigen::MatrixXd spring_forces = Eigen::MatrixXd(1, 3);
  spring_forces.setZero();

  Eigen::MatrixXd repulsion_forces = Eigen::MatrixXd(1, 3);
  repulsion_forces.setZero();

  Eigen::MatrixXd motion = Eigen::MatrixXd(1, 3);
  motion.setZero();

  for(auto idi : vs){

    Vertex* vi = V->at(idi);
    Eigen::MatrixXd xi = *vi->position;

    vi->acceleration->setZero();
    *vi->acceleration = tree->estimate(vi, Vertex::pairwise_repulsion);
  }

  auto es = edges();
  for(auto id : es){
    auto e = E->at(id);

    Eigen::MatrixXd xi = *e->source->position;
    Eigen::MatrixXd xj = *e->target->position;

    auto force = ((xi - xj) * -settings->get_attraction()) * settings->get_dampening();

    *e->source->acceleration += force;
    *e->target->acceleration -= force;
  }

  for(auto id : vs){
    Vertex* v = V->at(id);

    *v->acceleration -= (*v->velocity * settings->get_dampening());

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

  for(auto it : *E){
    if(it.second != NULL && (
      ((it.second->source != NULL) && (it.second->source->id == vertex->id)
      || (it.second->target != NULL) && (it.second->target->id == vertex->id)))){
      n.push_back(it.first);
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
