#ifndef BARNESHUTNODE3_H
#define BARNESHUTNODE3_H

#include <sstream>
#include <vector>
#include <map>
#include <queue>
#include <set>
#include "Settings.h"
#include "Vertex.h"
#include "Edge.h"
#include "eigen/Eigen/Dense"

namespace sc {
  class Settings;
  class Vertex;
  class Edge;
  class MatrixXd;

  class BarnesHutNode3 {
    public: 
      BarnesHutNode3(Settings*);
      ~BarnesHutNode3();

      Eigen::MatrixXd center() const;

      void insert(Vertex*);
      Eigen::MatrixXd estimate(Vertex* vertex, Eigen::MatrixXd (*force_fn)(Eigen::MatrixXd*, Eigen::MatrixXd*, Settings*));
      unsigned int size();

    private:
      std::string get_octant(Eigen::MatrixXd*);
      void place_inner(Vertex*);
      void place_outer(Vertex*);
      
      std::map<unsigned int, Vertex*>* inners;
      std::map<std::string, BarnesHutNode3*>* outers;
      Eigen::MatrixXd center_sum;
      unsigned int count;
      Settings* settings;
  };
}

#endif