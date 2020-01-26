#ifndef LAYOUTGRAPH_H
#define LAYOUTGRAPH_H

#include <sstream>
#include <vector>
#include <map>
#include <queue>
#include <set>
#include "Settings.h"
#include "Vertex.h"
#include "Edge.h"
#include "BarnesHutNode3.h"
#include "eigen/Eigen/Dense"
#include "DynamicMatching.h"


namespace sc {

  class Settings;
  class Vertex;
  class Edge;
  class BarnesHutNode3;
  class MatrixXd;
  class DynamicMatching;

  struct EdgeOrder { 
    bool operator()(const Edge*, const Edge*);
  };

  struct VertexOrder {
    bool operator()(const Vertex*, const Vertex*);
  };

  class LayoutGraph {
    public: 
      LayoutGraph(Settings*, int);
      LayoutGraph(const LayoutGraph& other);
      ~LayoutGraph();

      int id; // debug

      unsigned int add_vertex();
      unsigned int add_edge(unsigned int, unsigned int, bool, double);
      bool remove_vertex(unsigned int);
      bool remove_edge(unsigned int);
      
      bool clear();

      std::string layout();
      std::string get_center();

      std::string toJSON(bool recursive=false);

      friend class Edge;
      friend class Vertex;
      friend class DynamicMatching;
      DynamicMatching* dm;
      Eigen::MatrixXd center;
      Eigen::MatrixXd checkNan(Eigen::MatrixXd, Eigen::MatrixXd);
   
      Eigen::MatrixXd alpha__();
      Eigen::MatrixXd beta__();

      Eigen::MatrixXd alpha_;
      Eigen::MatrixXd beta_;

      Eigen::MatrixXd alpha;
      Eigen::MatrixXd beta;
      
      std::map<unsigned int, Vertex*>* V;
      std::map<unsigned int, Edge*>* E;
      Settings* settings;
      
      std::vector<unsigned int> incident_edges(Vertex* v);
      std::vector<unsigned int> vertices();
      std::vector<unsigned int> edges();

      std::string get_vertices();
      std::string get_edges();
    
      unsigned int vertex_spawn;
      unsigned int edge_spawn;

      void single_level_dynamics();
      void two_level_dynamics();
      /*
      void frame_dynamics();
      void time_dilation();
      */
  };
};

#endif