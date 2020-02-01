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

        // self.lg = null
        self.settings = Core.default_settings();
        self.lg = new Core.LayoutGraph(self.settings, 1);
        console.log('LayoutGraph initialized')

        postMessage({re: 0, result: 'started'});

        self.onmessage = async (e) => {
          switch(e.data._type){
            case 'start':
              /*
              var generateReply = (async (e) => {
                return await new Promise((resolve, reject) => {
                  self.settings = Core.default_settings();
                  self.lg = new Core.LayoutGraph(self.settings, 0);
                  resolve(self.lg);
                  return self.lg;
                });
              }).bind(self, e);

              self.postMessage.call(self, {re: e.data.msgId, 'result': (await generateReply())});
              */
              break;

            case 'setting':
              if(e.data.setting !== undefined){
                var result;
                
                if(e.data.set){
                  switch(e.data.setting){

                    default: 
                      result = self.settings[e.data.setting] = parseFloat(e.data.value);
                      break;
                  }
                }
                
                if(e.data.get){
                  switch(e.data.setting){
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
                result = self.lg.add_edge(parseInt(e.data.source), parseInt(e.data.target), e.data.directed, e.data.strength);
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
              try{
                var l = self.lg.layout();
                result = JSON.parse(l);
              }catch(e){
                result = 'stopped';
                self.dispatchEvent(new Event('stopped'))
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

            case 'end':
              
              if(self.lg != null){
                self.dispatchEvent(new Event('stopped'))
              }

              self.postMessage.call(self, {re: e.data.msgId, 'result': 'stopped'})
              break;
            }
          };

        };
      
    }, console.error);
    

    return Core;
  });
})