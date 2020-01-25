#ifndef EDGE_H
#define EDGE_H

#include "Settings.h"
#include "Vertex.h"
#include "LayoutGraph.h"
#include "BarnesHutNode3.h"
#include "eigen/Eigen/Dense"
#include "DynamicMatching.h"

namespace sc {

  class Vertex;
  class Settings;
  class BarnesHutNode3;
  class LayoutGraph;
  class MatrixXd;
  class DynamicMatching;


  class Edge {
    public:
      Edge(unsigned int, Vertex*, Vertex*, bool, double, LayoutGraph*);
      unsigned int id;
      LayoutGraph* graph;

      std::string toJSON();
      bool operator==(const Edge& other);

      ~Edge();

      double order;

    protected: 
      Vertex* source;
      Vertex* target;
      bool directed;
      double strength;
      Edge* coarser;
    
      bool depends(const Edge* other);
      unsigned int count; 

      Eigen::MatrixXd attraction(Settings*);
      bool shares_vertex_with(Edge*);
      bool depends(Edge*);

      friend class DynamicMatching;
      friend class LayoutGraph;
      friend class BarnesHutNode3;
  };
}

#endif