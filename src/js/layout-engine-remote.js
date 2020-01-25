/*
  layout-engine-remote.js
  
  Joshua Moore
  joshua.moore@leudla.net

  January 24th, 2020
*/

var worker = new Worker('./layout-engine.js');

async function post(msg){
  msg.msgId = Math.random().toString();
  var onmsg;
  var promise = new Promise((resolve, reject) => {
    onmsg = function(e){
      if(e.data.re == msg.msgId){
        resolve(e.data.result);
        worker.removeEventListener.bind(worker, 'message', onmsg);
        return e.data.result;
      }
      return false;
    }.bind(null);
    worker.addEventListener('message', onmsg);
    worker.postMessage(msg);
  });

  return await promise;
};

var started = new Promise((resolve, reject) => {
  var onstarted = function(e){
    if(e.data.re === 0){
      resolve(e.data.result);
      worker.removeEventListener('message', onstarted);
    }
  }

  worker.addEventListener('message', onstarted);
})

async function start(levels){
  return await post({"_type": 'start', "levels": levels});
};

async function add_vertex(){
  return await post({_type: 'add_vertex'});
};

async function add_edge(args){
  return await post({
    _type: 'add_edge', 
    source: args.source, 
    target: args.target, 
    directed: args.options.directed !== undefined ? args.options.directed : false, 
    strength: args.options.strength !== undefined ? args.options.strength : 1.0
  });
};

async function remove_vertex(id){
  var result = await post({_type: 'remove_vertex', 'id': id});
  return result;
};

async function remove_edge(id){
  var result = await post({_type: 'remove_edge', 'id': id});
  return result;
};

async function layout(){
  var result = await post({_type: 'layout'})
  return result;
}

async function clear(){
  var result = await post({_type: 'clear'});
  return result;
};

async function toJSON(){
  var result = await post({_type: 'toJSON'});
  return result;
};

async function setting({set, setting, value}){
  var result = await post({_type: 'setting', "set": set, 'setting': setting, 'value': value, "get": !set});
  return result;
}

function end(){
  self.terminate();
};

class Settings {
  constructor(obj){
    this._attraction = obj ? obj.attraction : 4e-1;
    this._repulsion = obj ? obj.repulsion : 1e-2;
    this._epsilon = obj ? obj.epsilon : 1e-4;
    this._inner_distance = obj ? obj.inner_distance : 9e-3;
    this._time_dilation = obj ? obj.time_dilation : 0.1;
    this._friction = obj ? obj.friction : 8e-1;
    this._gravity = obj ? obj.gravity : 1e1;
  }

  get attraction(){
    this._attraction = setting(false, 'attraction').result;
    return this._attraction;
  }

  set attraction(value){
    return this._attraction = setting(true, 'attraction', value).result;
  }

  get repulsion(){
    return this._repulsion = setting(false, 'repulsion').result;
  }

  set repulsion(value){
    return this._repulsion = setting(true, 'repulsion', value).result;
  }

  get epsilon(){
    return this._epsilon = setting(false, 'epsilon').result;
  }

  set epsilon(value){
    return this._epsilon = setting(true, 'epsilon', value).result;
  }

  get inner_distance(){
    return this._inner_distance = setting(false, 'inner_distance').result;
  }

  set inner_distance(value){
    return this._inner_distance = setting(true, 'inner_distance', value).result;
  }
  
  get friction(){
    return this._friction = setting(false, 'friction').result;
  }

  set friction(value){
    return this._friction = setting(true, 'friction', value).result;
  }  
  
  get gravity(){
    return this._gravity = setting(false, 'gravity').result;
  }

  set gravity(value){
    return this._gravity = setting(true, 'gravity', value).result;
  }

  get time_dilation(){
    return this._time_dilation = setting(false, 'time_dilation').result;
  }

  set time_dilation(value){
    return this._time_dilation = setting(true, 'time_dilation', value);
  }

}

var Remote = {
  /* start(Number levels) */
  'start': start,

  'started': started,
  
  /* unsigned int add_vertex() */
  'add_vertex': add_vertex,
  
  /* unsigned int add_edge(int source, int target, bool directed, float strength) */
  'add_edge': add_edge,
  
  /* remove_edge(unsigned int id) */
  'remove_vertex': remove_vertex,

  /* remove_edge(unsigned int id) */
  'remove_edge': remove_edge,

  /* (json) string layout() */
  'layout': layout,

  /* void clear() */
  'clear': clear,

  /* void end */
  'end': end,
  
  /* (json) string toJSON */
  'toJSON': toJSON,
  
  'worker': worker,
  'setting': setting,
  'Settings': Settings, // JS to CPP adapter
  'settings': new Settings() // Adapter instance
};

export default Remote;
