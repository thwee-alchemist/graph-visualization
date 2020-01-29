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
  double _dampening,
  double _theta){

  attraction = _attraction;
  repulsion = _repulsion;
  epsilon = _epsilon;
  inner_distance = _inner_distance;
  friction = _friction;
  gravity = _gravity;
  dampening = _dampening;
  theta = _theta;
};

double Settings::get_attraction() const {
  return attraction;
}

void Settings::set_attraction(double val){
  attraction = val;
}

double Settings::get_repulsion() const {
  return repulsion;
}

void Settings::set_repulsion(double val){
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

double Settings::get_theta() const {
  return theta;
}

void Settings::set_theta(double val){
  theta = val;
}
