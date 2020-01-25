#pragma cling add_include_path("eigen")
#pragma cling add_library_path("eigen")
#pragma cling load("eigen/Eigen/Dense")
#include "Settings.h"
#include "Vertex.h"
#include "Edge.h"
#include "BarnesHutNode3.h"
#include "LayoutGraph.h"
#include "DynamicMatching.h"
#include <iostream>
#include <vector>
#include <exception>
#include <map>
#include <queue>
#include <set>
#include <cassert>
#include <sstream>
#include <iterator>

using namespace sc;

DynamicMatching::DynamicMatching(LayoutGraph* _graph, int levels){
  graph = _graph;
  m = new std::map<unsigned int, bool>();
  pq = new std::priority_queue<Edge*, std::vector<Edge*>, EdgeOrder>();
  coarser = new LayoutGraph(graph->settings, levels);
  V = new std::map<unsigned int, unsigned int>();
  E = new std::map<unsigned int, unsigned int>();
}

void DynamicMatching::clear(){

  coarser->clear();

  delete m;
  delete pq;
  delete V;
  delete E;

  m = new std::map<unsigned int, bool>();
  pq = new std::priority_queue<Edge*, std::vector<Edge*>, EdgeOrder>();
  V = new std::map<unsigned int, unsigned int>();
  E = new std::map<unsigned int, unsigned int>();
}

DynamicMatching::~DynamicMatching(){
  delete m;
  delete coarser;
  delete pq;
  delete E;
  delete V;
}

Vertex* DynamicMatching::get_corresponding_vertex(Vertex* v){
  auto it = V->find(v->id);
  if(it == V->end()){
    return NULL;
  }else{
    return (*coarser->V)[it->second];
  }
}

Edge* DynamicMatching::get_corresponding_edge(Edge* e){
  auto it = E->find(e->id);
  if(it == E->end()){
    return NULL;
  }else{
    return (*coarser->E)[it->second];
  }
}

void DynamicMatching::add_vertex(Vertex* vertex){
  // std::cout << "DM-" << graph->id << "::add_vertex " << vertex->id << std::endl;
  // auto id = coarser->add_vertex();
  // V->emplace(vertex->id, id);
  process_queue();
}

void DynamicMatching::add_edge(Edge* e){
  // std::cout << "DM-" << graph->id << "::add_edge " << e->id << std::endl;

  // increase the count of (v1', v2') in G', possibly adding an edge if not already present
  // Note: this will also add corresponding vertices if they do not already exist
  Edge* e_prime = make_corresponding_edge(e);

  E->emplace(e->id, e_prime->id);

  // add e to the queue
  // pq->push(e_prime);
  pq->push(e);

  process_queue();
}

void DynamicMatching::remove_vertex(Vertex* v){
  // std::cout << "remove_vertex(Vertex*)" << v->id << std::endl;

  // for each edge e incident on v, deleteEdge
  auto ies = graph->incident_edges(v);
  for(auto id : ies){
    remove_edge(graph->E->at(id));
  }

  // remove from coarser
  coarser->remove_vertex((*V)[v->id]);
  
  // remove v from V.
  V->erase(v->id);
  process_queue();
}

void DynamicMatching::remove_edge(Edge* e){
  if(e == NULL){
    return;
  }

  // std::cout << "DM-" << graph->id << "::remove_edge " << e->id << std::endl;
  unsigned int e_id = e->id;

  // if e is in the matching, then unmatch e
  auto it = m->find(e->id);
  if((it != m->end()) && (*m)[e->id]){
    unmatch(e);
  }

  // decrease the count of (v1', v2') in E'
  Edge* e_prime;
  e_prime = get_corresponding_edge(e);
  if(e_prime){
    e_prime->count--;

    // if this count is 0, then delete this edge from E'
    if(e_prime->count <= 0){
      coarser->remove_edge(get_corresponding_edge(e)->id);
      E->erase(e->id);
      assert(e->id > 0);

      remove_from_pq(e);
    }
  }

  // if either v1 or v2 have no edges except e,
  // then remove v1', resp. v2'
  if((coarser != NULL) && (e->source->edges->size() == 1)){
    Vertex* cv = get_corresponding_vertex(e->source);
    if(cv != NULL){
      coarser->remove_vertex(cv->id);
      V->erase(cv->id);
    }
  }

  if((e != NULL) && (coarser != NULL) && (e->target->edges->size() == 1)){
    Vertex* cv = get_corresponding_vertex(e->target);
    if(cv != NULL){
      coarser->remove_vertex(cv->id);
      V->erase(cv->id);
    }
  }

  if(coarser){
    m->erase(e->id);
  }

  // add all edges e' with e -> e' to the queue

  for(auto id : graph->edges()){
    if(id == e_id){
      continue;
    }
    Edge* edge = (*graph->E)[id];
    if(edge && (edge->id != e_id)){
      if(e->depends(edge)){
        pq->push(edge);
      }
    }
  }

  process_queue();
}

void DynamicMatching::remove_from_pq(Edge* e){
  std::priority_queue<Edge*, std::vector<Edge*>, EdgeOrder> second_pq;
  while(!pq->empty()){
    if(pq->top()->id != e->id){
      second_pq.push(pq->top());
    }
    pq->pop();
  }
  
  while(!second_pq.empty()){
    pq->push(second_pq.top());
    second_pq.pop();
  }
}

void DynamicMatching::match(Edge* e){
  // std::cout << "DM-" << graph->id << "::match " << e->id << std::endl;z

  // for each edge e' where e -> e', if e' is matched then unmatch e'
  auto e_primes = graph->edges();
  for(auto edge_id : e_primes){
    if(edge_id == e->id){
      continue;
    }
    Edge* edge = (*graph->E)[edge_id];
    if(e != NULL && e->depends(edge) && (*m)[edge->id]){
      unmatch(edge);
    }
  }
  
  // delete vertices v1' and v2' from the coarser graph
  Vertex* v1_prime = get_corresponding_vertex(e->source);
  Vertex* v2_prime = get_corresponding_vertex(e->target);

  if((v1_prime != NULL) && (v2_prime != NULL)){
    bool same = v1_prime->id == v2_prime->id;

    // coarser->
    coarser->remove_vertex(v1_prime->id);
    if(!same && (v2_prime != NULL)){
      coarser->remove_vertex(v2_prime->id);
    }
  }

  // create new vertex v1 u v2 in G'
  unsigned int vertex_id = coarser->add_vertex();
  Vertex* v1_v2 = (*coarser->V)[vertex_id];

  v1_v2->add_finer(e->source);
  v1_v2->add_finer(e->target);
  V->emplace(e->source->id, vertex_id);
  V->emplace(e->target->id, vertex_id);

  // for each edge incident on v1 or v2 in G, add a corresponding edge to G'. 
  auto ies = graph->incident_edges(e->source);
  for(auto ieid : ies){
    if(ieid != e->id){
      Edge* incident_edge = (*graph->E)[ieid];
      make_corresponding_edge(incident_edge);
    }
  }
  
  for(auto ieid : ies){
    if(ieid != e->id){
      Edge* incident_edge = (*graph->E)[ieid];
      make_corresponding_edge(incident_edge);
    }
  }
  
  // for each e' such that e -> e' add e' to the queue
  // e_primes = graph->edges();
  for(auto e_prime_id : e_primes){
    if(e_prime_id == e->id){
      continue;
    }
    Edge* e_prime = (*graph->E)[e_prime_id];
    if(e->depends(e_prime)){
      pq->push(e_prime);
    }
  }

  m->emplace(e->id, true);
}

void DynamicMatching::unmatch(Edge* e){
  // std::cout << "DM-" << graph->id << "::unmatch " << e->id << std::endl;
  if(e == NULL){
    return;
  }

  // delete any edges in G' incident on v1 u v2
  Vertex* v1_v2 = get_corresponding_vertex(e->source);

  if(v1_v2 != NULL){
    for(auto it : *v1_v2->edges){
      remove_edge(it.second);
    }

    // delete the vertex v1 u v2 from G'
    remove_vertex(v1_v2);
  }

  // add new vertices v1' and v2' to G' 
  Vertex* v1_prime = make_corresponding_vertex(e->source);
  Vertex* v2_prime = make_corresponding_vertex(e->target);

  assert(v1_prime != NULL);
  assert(v2_prime != NULL);
  
  // for each edge incident on v1 or v2 in G, add a corresponding edge to G'
  auto ids = graph->incident_edges(e->source);
  for(auto incident_edge_id : ids){
    if(e->id == incident_edge_id){
      continue;
    }
    Edge* incident_edge = (*graph->E)[incident_edge_id];
    make_corresponding_edge(incident_edge);
  }

  ids = graph->incident_edges(e->target);
  for(auto incident_edge_id : ids){
    if(e->id == incident_edge_id){
      continue;
    }

    Edge* incident_edge = (*graph->E)[incident_edge_id];
    make_corresponding_edge(incident_edge);
  }
  
  // for each e' such that e -> e', add e' to the queue
  auto edge_ids = graph->edges();
  for(unsigned int edge_id : edge_ids){
    if(edge_id == e->id){
      continue;
    }
    Edge* edge = (*graph->E)[edge_id];
    assert(edge != NULL);

    if(e->depends(edge)){
      pq->push(edge);
    }
  }

  m->emplace(e->id, false);
}

bool DynamicMatching::match_equation(Edge* e){

  if(E->size() <= 1){
    return true;
  }
  
  bool me = true;
  for(unsigned int edge_id : graph->edges()){
    if(edge_id != e->id){
      Edge* edge = (*graph->E)[edge_id];
      // ?
      if(edge != NULL){
        me = me && !edge->depends(e);
        if(!me){
          return false;
        }
      }
    }
  }
  
  return me;
}

void DynamicMatching::process_queue(){
  while(!pq->empty()){
    Edge* e = pq->top();
    assert(e != NULL);
    pq->pop();

    bool me = match_equation(e);

    if(me != (*m)[e->id]){
      if(me){
        match(e);
      }else{
        unmatch(e);
      }
    }
  }
}

std::string DynamicMatching::toJSON(){
  std::stringstream stream;
  unsigned int i = 0;
  
  stream << "{\"V\":[";
  for(auto it : *V){
    stream << "[" << it.first << "," << it.second << "]";
    if(i < ((V->size())-1)){
      stream << ",";
    }
    i++;
  }
  stream << "]";

  i = 0;
  stream << ",\"E\":[";
  for(auto it : *E){
    stream << "[" << it.first << "," << it.second << "]";
    if(i < ((E->size())-1)){
      stream << ",";
    }
    i++;
  }
  stream << "],";
  
  i = 0;
  stream << "\"m\":[";
  for(auto it : *m){
    stream << "[" << it.first << ", " << (it.second ? "true" : "false") << "]";
    if(i < m->size()-1){
      stream << ",";
    }
    i++;
  }
  stream << "],";
  
  i = 0;
  std::priority_queue<Edge*, std::vector<Edge*>, EdgeOrder> second;

  stream << "\"pq\":[";
  while(!pq->empty()){
    second.push(pq->top());
    stream << pq->top()->id;
    pq->pop();
    if(!pq->empty()){
      stream << ",";
    }
  }
  while(!second.empty()){
    pq->push(second.top());
    second.pop();
  }
  stream << "],\"coarser\":" << coarser->toJSON(true)
  << "}";
  return stream.str();
}

Vertex* DynamicMatching::make_corresponding_vertex(Vertex* v){
  Vertex* cv = get_corresponding_vertex(v);

  if(cv != NULL){
    return cv;
  }

  auto cvid = coarser->add_vertex();
  v->coarser = cv;
  cv = (*coarser->V)[cvid];
  cv->add_finer(v);
  v->coarser = cv;
  
  V->emplace(v->id, cv->id);

  return cv;
}

Edge* DynamicMatching::make_corresponding_edge(Edge* e){
  Edge* ce = get_corresponding_edge(e);
  
  if(ce != NULL){
    ce->count++;
    return ce;
  }

  Vertex* coarse_source = make_corresponding_vertex(e->source);
  Vertex* coarse_target = make_corresponding_vertex(e->target);

  assert(coarse_source != NULL);
  assert(coarse_target != NULL);

  // the coarse vertices might have been combined into a single v1_v2, 
  // in which case we don't add another edge here. 
  // this is already checked in the add_edge function of the layoutgraph
  // if(coarse_source->id != coarse_target->id){

    unsigned int ceid = coarser->add_edge(
      coarse_source->id,
      coarse_target->id,
      e->directed,
      e->strength
    );

    ce = (*coarser->E)[ceid];

    return ce;
  // }

  // return NULL;
}