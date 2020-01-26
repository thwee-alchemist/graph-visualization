#include "Settings.h"
#include <iostream>

using namespace sc;

Settings::Settings(
  double _attraction,
  double _repulsion, 
  double _epsilon, 
  double _inner_distance, 
  double _friction, 
  double _gravity,
  double _time_dilation,
  double _dampening){

  attraction = _attraction;
  repulsion = _repulsion;
  epsilon = _epsilon;
  inner_distance = _inner_distance;
  friction = _friction;
  gravity = _gravity;
  time_dilation = _time_dilation;
  dampening = _dampening;
};

double Settings::get_attraction() const {
  return attraction;
}

void Settings::set_attraction(double val){
  std::cout << "attraction" << val << std::endl;
  attraction = val;
}

double Settings::get_repulsion() const {
  return repulsion;
}

void Settings::set_repulsion(double val){
  std::cout << "repulsion" << val << std::endl;
  repulsion = val;
}

double Settings::get_epsilon() const {
  return epsilon;
}

void Settings::set_epsilon(double val){
  epsilon = val;
}

double Settings::get_inner_distance() const {
  return inner_distance;
};

void Settings::set_inner_distance(double val){
  inner_distance = val;
}

double Settings::get_dampening() const{
  return dampening;
}

void Settings::set_dampening(double val){
  dampening = val;
}

double Settings::get_friction() const {
  return friction;
}

void Settings::set_friction(double val){
  friction = val;
}

double Settings::get_gravity() const {
  return gravity;
}

void Settings::set_gravity(double val){
  gravity = val;
}

double Settings::get_time_dilation() const {
  return time_dilation;
}

void Settings::set_time_dilation(double val){
  time_dilation = val;
}
