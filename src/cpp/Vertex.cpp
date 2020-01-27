#include <sstream>
#include "Settings.h"
#include "eigen/Eigen/Dense"
#include "Edge.h"
#include "Vertex.h"
#include <vector>

#include <iostream>

using namespace sc;

Vertex::Vertex(unsigned int _id, LayoutGraph* _graph) {
  id = _id;
  graph = _graph;
  position = new Eigen::MatrixXd(1, 3);
  position->setRandom();

  velocity = new Eigen::MatrixXd(1, 3);
  velocity->setZero();

  acceleration = new Eigen::MatrixXd(1, 3);
  acceleration->setZero();

  coarser = NULL;

  repulsion_forces = new Eigen::MatrixXd(1, 3);
  repulsion_forces->setZero();

  attraction_forces = new Eigen::MatrixXd(1, 3);
  attraction_forces->setZero();

  finers = new std::vector<Vertex*>();
  edges = new std::map<unsigned int, Edge*>();

  displacement = new Eigen::MatrixXd(1, 3);
  displacement->setZero();

  displacement_ = new Eigen::MatrixXd(1, 3);
  displacement_->setZero();

  displacement__ = new Eigen::MatrixXd(1, 3);
  displacement__->setZero();

  proj_accel = new Eigen::MatrixXd(1, 3);
  proj_accel->setZero();
}

Vertex::~Vertex(){
  delete finers;
  delete edges;
  delete position;
  delete velocity;
  delete acceleration;
  delete repulsion_forces;
  delete attraction_forces;
  delete displacement;
  delete displacement_;
  delete displacement__;
  delete proj_accel;
}

double Vertex::x(){
  return (*position)(0);
}

double Vertex::y(){
  return (*position)(1);
}

double Vertex::z(){
  return (*position)(2);
}

bool Vertex::operator==(const Vertex& other){
  return id == other.id;
}

std::string Vertex::toJSON(){
  std::stringstream ss;
  ss << "{\"id\":" << id 
  << ",\"x\":" << x() 
  << ",\"y\":" << y() 
  << ",\"z\":" << z()
  <<  "}";
  return ss.str();
}

void Vertex::add_finer(Vertex* fine){
  (*finers).push_back(fine);
  for(auto it = fine->edges->begin(); it != fine->edges->end(); it++){
    edges->emplace(it->first, it->second);
  }
}

Eigen::MatrixXd Vertex::pairwise_repulsion(Eigen::MatrixXd* one, Eigen::MatrixXd* two, Settings& settings){

  Eigen::MatrixXd diff = (*one - *two);

  double firstDenominator = settings.epsilon + diff.squaredNorm();
  Eigen::MatrixXd repulsion = (settings.friction / firstDenominator) * (diff / (settings.epsilon + diff.norm()));

  return repulsion;
}

bool Vertex::has(unsigned int vertex_id){

  for(auto v : *finers){
    if(v->id == vertex_id || v->has(vertex_id)){
      return true;
    }
  }

  return false;
};

