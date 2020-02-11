#ifndef VERTEX_H
#define VERTEX_H

#include <set>
#include "Settings.h"
#include "eigen/Eigen/Dense"
#include "Edge.h"
#include "LayoutGraph.h"

namespace sc {

  class Settings;
  class Edge;
  class MatrixXd;
  class LayoutGraph;
  class EdgeOrder;

  class Vertex {
    private:
      static void initializePRNG();
      static bool initialized;

    public: 
      friend class Edge;
      friend class LayoutGraph;
      friend class BarnesHutNode3;

      Vertex(unsigned int, LayoutGraph* graph);
      unsigned int id;
      LayoutGraph* graph;

      bool operator==(const Vertex&);
      std::string toJSON();
      
      ~Vertex();

    protected:
      double x();
      double y();
      double z();

      Eigen::MatrixXd* position;
      Eigen::MatrixXd* velocity;
      Eigen::MatrixXd* acceleration;

      Eigen::MatrixXd* displacement;
      Eigen::MatrixXd* displacement_;
      Eigen::MatrixXd* displacement__;

      Eigen::MatrixXd* proj_accel;

      Eigen::MatrixXd* repulsion_forces;
      Eigen::MatrixXd* attraction_forces;

      Vertex* coarser;
      std::vector<Vertex*>* finers;
      std::map<unsigned int, Edge*>* edges; 

      void add_finer(Vertex*);
      bool has(unsigned int);
      static Eigen::MatrixXd pairwise_repulsion(Eigen::MatrixXd*, Eigen::MatrixXd*, Settings& settings);

      friend class LayoutGraph;
      friend class BarnesHutNode3;
      friend class DynamicMatching;
  };
}

#endif