#include "Vertex.h"
#include "Edge.h"
#include "BarnesHutNode3.h"

#include <iostream>

using namespace sc;

BarnesHutNode3::BarnesHutNode3(Settings& _settings){
  count = 0;
  center_sum = Eigen::MatrixXd(1, 3);
  center_sum.setZero();

  settings = &_settings;

  inners = new std::map<unsigned int, Vertex*>();
  outers = new std::map<std::string, BarnesHutNode3*>();
}

BarnesHutNode3::~BarnesHutNode3(){
  for(auto outer : *outers){
    delete outer.second;
  }

  // outers->clear();
  // inners->clear();

  delete outers;
  delete inners;
}

/*
 * center()
 * 
 * Don't call this function on an empty BarnesHutNode3, check via size() 
 */
Eigen::MatrixXd BarnesHutNode3::center() const {
  return center_sum / (double)count;
}

void BarnesHutNode3::insert(Vertex* vertex){
  count++;
  
  if(inners->size() == 0){
    place_inner(vertex);
  }else{
    Eigen::MatrixXd c = center();
    double distance = (c - *vertex->position).norm();

    if(distance <= settings->inner_distance){
      place_inner(vertex);
    }else{
      place_outer(vertex);
    }
  }
}

std::string BarnesHutNode3::get_octant(Eigen::MatrixXd* position){
  Eigen::MatrixXd c = center();
  
  std::string x = c(0) < (*position)(0) ? "l" : "r";
  std::string y = c(1) < (*position)(1) ? "u" : "d";
  std::string z = c(2) < (*position)(2) ? "i" : "o";

  return x + y + z;
}

void BarnesHutNode3::place_inner(Vertex* vertex){
  inners->emplace(vertex->id, vertex);
  center_sum += *vertex->position;
}

void BarnesHutNode3::place_outer(Vertex* vertex){
  std::string octant = get_octant(vertex->position);
  if((*outers)[octant] == NULL){
    (*outers)[octant] = new BarnesHutNode3(*settings);
  }

  (*outers)[octant]->insert(vertex);
}

Eigen::MatrixXd BarnesHutNode3::estimate(Vertex* vertex, Eigen::MatrixXd (*force_fn)(Eigen::MatrixXd* one, Eigen::MatrixXd* two, Settings& settings)){  
  Eigen::MatrixXd force = Eigen::MatrixXd(1, 3);
  force.setZero();

  if(inners->find(vertex->id) != inners->end()){
    for(auto inner : *inners){
      if(inner.first != vertex->id){
        force += force_fn(vertex->position, inner.second->position, *settings);
      }
    }
  }else{
    auto c = center();
    force += force_fn(vertex->position, &c, *settings) * (double)inners->size();
  }

  for(auto outer : *outers){
    auto c = outer.second->center();
    force += force_fn(vertex->position, &c, *settings) * (double)outer.second->count;
  }

  return force;
}

/*
 * size()
 * returns the size of the inners vector.
 */
unsigned int BarnesHutNode3::size(){
  return inners->size(); // this might have to be more complicated.
}

