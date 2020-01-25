

/*
  layout-engine.js

  Joshua Moore
  joshua.moore@leudla.net

  November 9th, 2019
  January 24th, 2020
*/

var request = new Request('./core.js', {
  method: 'GET',
  mode: 'cors',
  redirect: 'follow',
  headers: new Headers({
    'Content-Type': 'text/javascript'
  })
})

fetch(request).then((response) => {
  response.blob().then((blob) => {
    var Core;
    blob.text().then((source) => {
      self.eval(source);
      Core = Module;

      Core.onRuntimeInitialized = () => {
        console.log('Runtime initialized')

        if(self.lg){
          self.lg.delete();
        }

        // self.lg = null
        self.settings = Core.default_settings();
        self.lg = new Core.LayoutGraph(self.settings, 0);
        console.log('LayoutGraph initialized')

        postMessage({re: 0, result: 'started'});

        self.onmessage = async (e) => {
          switch(e.data._type){
            case 'start':
              var generateReply = (async (e) => {
                return await new Promise((resolve, reject) => {
                  self.settings = Core.default_settings();
                  self.lg = new Core.LayoutGraph(self.settings, 0);
                  resolve(self.lg);
                  return self.lg;
                });
              }).bind(self, e);

              self.postMessage.call(self, {re: e.data.msgId, 'result': (await generateReply())});
              break;

            case 'setting':
              if(e.data.setting !== undefined){
                var result;
                
                if(e.data.set){
                  switch(e.data.setting){
                    /*
                    case 'dampening':
                      result = self.settings.dampening = e.data.value;
                      break;
                    case 'attraction':
                      result = self.settings.attraction = e.data.value;
                      break;
                    case 'repulsion':
                      result = self.settings.repulsion = e.data.value;
                      break;
                    case 'epsilon':
                      result = self.settings.epsilon = e.data.value;
                      break;
                    case 'inner_distance':
                      result = self.settings.inner_distance = e.data.value;
                      break;
                    case 'friction':
                      result = self.settings.friction = e.data.value;
                      break;
                    case 'gravity':
                      result = self.settings.gravity = e.data.value;
                      break;
                    case 'time_dilation':
                      result = self.settings.time_dilation = e.data.value;
                      break;
                      */
                    default: 
                      result = self.settings[e.data.setting] = e.data.value;
                      break;
                  }
                }
                
                if(e.data.get){
                  switch(e.data.setting){
                    case 'dampening':
                      result = self.settings.dampening;
                      break;
                    case 'attraction':
                      result = self.settings.attraction;
                      break;
                    case 'repulsion':
                      result = self.settings.repulsion;
                      break;
                    case 'epsilon':
                      result = self.settings.epsilon;
                      break;
                    case 'inner_distance':
                      result = self.settings.inner_distance;
                      break;
                    case 'friction':
                      result = self.settings.friction;
                      break;
                    case 'gravity':
                      result = self.settings.gravity;
                      break;
                    case 'time_dilation':
                      result = self.settings.time_dilation;
                      break;
                    default: 
                      result = self.settings[e.data.setting];
                      break;
                  }
                }

                self.postMessage.call(self, {re: e.data.msgId, 'result': parseFloat(result)});
              }
              break;

            case 'add_vertex':
              var result;
              try{
                result = self.lg.add_vertex();
              }catch(e){
                console.error(e);
              }finally{
                self.postMessage.call(self, {re: e.data.msgId, 'result': result});
              }
              break;

            case 'add_edge':
              var result;
              try{
                result = self.lg.add_edge(e.data.source, e.data.target, (e.data.directed !== undefined && e.data.directed ? true : false), e.data.strength);
              }catch(e){
                result = e;
              }finally{
                self.postMessage.call(self, {re: e.data.msgId, 'result': result});
              };
              break;

            case 'remove_vertex':
              var result;
              try{
                result = self.lg.remove_vertex(e.data.id);
              }catch(e){
                result = e;
              }finally{
                self.postMessage.call(self, {re: e.data.msgId,  _type: e.data._type, 'result': result});
              }
              break;

            case 'remove_edge':
              var result;
              try{
                result = self.lg.remove_edge(e.data.id);
              }catch(e){
                result = e;
              }finally{
                self.postMessage.call(self, {re: e.data.msgId, 'result': result});
              };
              break;

            case 'layout':
              var result;
              try{
                result = JSON.parse(self.lg.layout());
              }catch(e){
                result = e;
              }finally{
                self.postMessage.call(self, {re: e.data.msgId, 'result': result});
              }
              break;

            case 'clear':
              try{
                self.postMessage.call(self, {re: e.data.msgId, result: lg.clear()});
              }catch(e){
                self.postMessage.call(self, {re: e.data.msgId, result: new Error("Unknown operation")});
              }
              break;

            case 'toJSON':
              try{
                var result = self.lg.toJSON(true);
                self.postMessage.call(self, {re: e.data.msgId, 'result': result});
              }catch(err){
                self.postMessage.call(self, {re: e.data.msgId, 'result': err});  
              }
              break;

            }
          };

        };
      
    }, console.error);
    

    return Core;
  });
})