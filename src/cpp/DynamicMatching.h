#ifndef DYNAMICMATCHING_H
#define DYNAMICMATCHING_H

#include <sstream>
#include <vector>
#include <map>
#include <queue>
#include <set>
#include <algorithm>
#include "Vertex.h"
#include "Edge.h"
#include "LayoutGraph.h"

namespace sc {
  class Vertex;
  class Edge;
  class BarnesHutNode3;
  class LayoutGraph;
  struct EdgeOrder;

  // https://arxiv.org/pdf/0712.1549.pdf
  class DynamicMatching {
    public:
    
    /* A reference to the finer graph */
    LayoutGraph* graph;
    
    /* A map holding the solutions of match equations for fine edges */
    std::map<unsigned int, bool>* m;
    
    /* A priority queue for edges to be processed */
    std::priority_queue<Edge*, std::vector<Edge*>, EdgeOrder>* pq;
    
    /* A map from a fine vertex to a coarse vertex */
    std::map<unsigned int, unsigned int>* V;
    
    /* A set of edges contained in this matching*/
    std::map<unsigned int, unsigned int>* E;

    /* A reference to the coarser graph, if applicable */
    LayoutGraph* coarser;
    
    /* The constructor */
    DynamicMatching(LayoutGraph* _graph, int levels);
    ~DynamicMatching();

    void remove_from_pq(Edge* e);

    void add_vertex(Vertex* vertex);
    void add_edge(Edge* edge);
    void remove_vertex(Vertex* vertex);
    void remove_edge(Edge* edge);
    
    /* returns a coarser vertex from a finer vertex */
    Vertex* get_corresponding_vertex(Vertex*);
    Edge* get_corresponding_edge(Edge*);
    Vertex* make_corresponding_vertex(Vertex*);
    Edge* make_corresponding_edge(Edge*);

    std::string toJSON();

    void clear();

    protected:
      void match(Edge* edge);
      void unmatch(Edge* edge);
      bool match_equation(Edge* edge);
      void process_queue();
  };
};

#endif