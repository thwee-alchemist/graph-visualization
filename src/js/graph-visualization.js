
/*
  graph-visualization.js
  Joshua Marshall Moore
  January 24th, 2020
*/

import * as THREE from '../../node_modules/three';
import { OrbitControls } from '../../node_modules/three/examples/jsm/controls/OrbitControls.js';
import Remote from "./layout-engine-remote.js";

// https://stackoverflow.com/a/56266358/5865620
const isValidColor = (strColor) => {
  const s = new Option().style;
  s.color = strColor;
  return s.color !== '';
}

// https://stackoverflow.com/a/43467144/5865620
var isValidUrl = (string) => {
  if(isValidColor(string)){
    return false;
  }

  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;  
  }
}

class GraphVertex extends HTMLElement {
  constructor(){
    super();

    this._size = undefined;
    this._face = undefined;
    this._onclick = undefined;
  }  

  connectedCallback(){
    this.size = this.getAttribute('size');
    this.face = this.getAttribute('face');

    console.log('vertex connected')
  }

  adoptedCallback(){
    this.connectedCallback();
  }

  disconnectedCallback(){
    console.log('vertex disconnected')
  }

  get size(){
    return this._size;
  }

  set size(val){
    this._size = val;
    this.setAttribute('size', val);
  }

  get face(){
    return this._face;
  }

  set face(val){
    this._face = val;
    this.setAttribute('face', val);
  }
}

class VertexLabel extends HTMLElement {
  constructor(){
    super();

    this._reference = undefined;
  }

  get ref(){
    return this._reference;
  }

  set ref(val){
    this._reference = val;
    this.setAttribute('ref', val);
  }
}


class GraphEdge extends HTMLElement {
  constructor(){
    super();

    this._color = undefined;
    this._strength = undefined;
    this._source = undefined;
    this._target = undefined;
  }

  get source(){
    return this._source;
  }

  set source(val){
    this._source = val;
    this.setAttribute('source', val);
  }

  get target(){
    return this._target;
  }

  set target(val){
    this._target = val;
    this.setAttribute('target', val);
  }

  get color() {
    return this._color;
  }

  set color(val){
    this._color = val;
    this.setAttribute('color', val);
  }

  get strength(){
    return this._strength;
  }

  set strength(val){
    this._strength = val;
    this.setAttribute('strength', val);
  }

  connectedCallback(){

    this.color = this.getAttribute('color');
    this.strength = this.getAttribute('strength');

    console.log('edge connected');
  }

  adoptedCallback(){
    this.connectedCallback();
  }

  disconnectedCallback(){
    console.log('edge disconnected');
  }
}


class GraphVisualization extends HTMLElement {
  constructor(width='100px', height="100px"){
    super(width, height);
    this.attachShadow({mode: 'open'});

    this._defaults = {
      vertex: {
        size: 10,
        face: 'black'
      },
      edge: {
        color: 'black',
        strength: 1.0
      }
    }

    /*
    this._attraction     = undefined;
    this._repulsion      = undefined;
    this._epsilon        = undefined;
    this._inner_distance = undefined;
    this._time_dilation  = undefined;
    this._friction       = undefined;
    this._gravity        = undefined;
    this._dampening      = undefined;
    this._drag           = undefined;
    this._theta          = undefined;
    this._spread         = undefined;
    */
  }

  /*
  get attraction(){
    return this._attraction;
  }

  set attraction(val){
    this._attraction = val;
    this.setAttribute('attraction', val);
  }

  get repulsion(){
    return this._repulsion;
  }

  set repulsion(val){
    this._repulsion = val;
    this.setAttribute('repulsion', val);
  }

  get epsilon(){
    return this._epsilon;
  }

  set epsilon(val){
    this._epsilon = val;
    this.setAttribute('epsilon', val);
  }

  get inner_distance(){
    return this._inner_distance;
  }

  set inner_distance(val){
    this._inner_distance = val;
    this.setAttribute('inner-distance', val);
  }

  get time_dilation(){
    return this._time_dilation;
  }

  set time_dilation(val){
    this._time_dilation = val;
    this.setAttribute('time-dilation', val);
  }

  get friction(){
    return this._friction;
  }

  set friction(val){
    this._friction = val;
    this.setAttribute('friction', val);
  }

  get gravity(){
    return this._gravity;
  }

  set gravity(val){
    this._gravity = val;
    this.setAttribute('gravity', val);
  }

  get dampening(){
    return this._dampening;
  }

  set dampening(val){
    this._dampening = val;
    this.setAttribute('dampening', val);
  }

  get drag(){
    return this._drag;
  }

  set drag(val){
    this._drag = val;
    this.setAttribute('drag', val); 
  }

  get theta(){
    return this._theta;
  }

  set theta(val){
    this._theta = val;
    this.setAttribute('theta', val);
  }

  get spread(){
    return this._spread;
  }

  set spread(val){
    this._spread = val;
    this.setAttribute('spread', val);
  }
  */

  /**
   * setSize(width, height)
   * 
   * Sets the width and height of the graph visualization.
   * 
   * Preconditions:
   * - super() has been called
   * - attachShadow has been called
   * 
   * Postconditions:
   * - element should be specified size.
   * 
   * @param {dimension} width 
   * @param {dimension} height 
   */
  setSize(width, height){
    console.log('setSize', width, height)

    var style = this.shadowRoot.querySelector('style.default');

    if(style){
      this.shadowRoot.removeChild(style);
    }

    var styleTemplate = document.createElement('template');
    styleTemplate.innerHTML = `
    <style class="default">
    :host {
      display: block;
      width: ${width};
      height: ${height};
      margin: 0;
      padding: 0;
      border: 1px dashed black;
      resize: both;
    }

    canvas {
      width: ${width};
      height: ${height};
    }
    </style>`;

    var style = styleTemplate.content.cloneNode(true);
    this.shadowRoot.appendChild(style);

    this.style.width = width;
    this.style.height = height;

    if(this.canvas){
      this.canvas.style.width = this.canvas.width = width;
      this.canvas.style.height = this.canvas.height = height;
    }

    this.shadowRoot.appendChild(style);

    // resize the canvas
    if(this.renderer){
      this.resizeRenderer();
    }

    // change the camera aspect
    if(this.camera){
      this.resizeCamera();
    }

    this.setAttribute('width', width);
    this.setAttribute('height', height);
  }

  resizeRenderer(){
    this.renderer.setSize(this.clientWidth, this.clientHeight, true);

  }

  resizeCamera(){
    this.camera.aspect = this.clientWidth / this.clientHeight;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Preconditions:
   * - super has been called
   * - this.canvas has been assigned a canvas element
   * 
   * Postconditions:
   * - scene has been created
   * - renderer has been created
   * - scene size and perspective are set
   */
  setupScene(){
    this.scene = new THREE.Scene();

    this.light = new THREE.AmbientLight( 0x404040, 1.0 );
    this.scene.add(this.light);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });

    console.log('setupScene', this.width, this.height);
    this.setSize(this.width, this.height);

    this.renderer.setClearAlpha(0.0);

    console.log(this.clientWidth, this.clientHeight);

    this.camera = new THREE.PerspectiveCamera( 75, this.clientWidth / this.clientHeight, 1, 1000 );


    this.scene.add(this.camera);

    this.camera.position.set(0, 0, -50);
    this.camera.lookAt(0,0,0)
    this.camera.updateProjectionMatrix();


  }

  async setupCore(){
    this.layout = Remote;

    for(var prop in this.layout.settings){
      ((prop) => {
        var readSetting = prop;
        var propertyName = prop.substring(1);
        var attributeName = propertyName.replace('_', '-');
        var valueName = prop;

  /*
        console.log('setting up', {
          'readSetting': prop,
          'propertyName': propertyName,
          'attributeName': attributeName,
          'valueName': valueName
        })*/

        // this._prop
        this[prop] = undefined;

        // this.prop
        Object.defineProperty(this, propertyName, {
          get: function(){
            return this[valueName];
          },
          set:  function(value){
            this[valueName] = value;
            this.setAttribute(attributeName, value)
            this.layout.settings[propertyName] = value;
          }
        })

        this[propertyName] = this.hasAttribute(attributeName) ? parseFloat(this.getAttribute(attributeName)) : this.layout.settings[readSetting];

        if(this.hasAttribute(attributeName)){
          this[propertyName] = parseFloat(this.getAttribute(attributeName));
          this.layout.settings[propertyName] = this[propertyName];
        }else{
          this.propertyName = this.layout.settings[readSetting];
        }
      })(prop)
    }

    console.log(this.layout.settings);

    return new Promise((resolve, reject) => {
      this.layout.started.then(() => {
        console.log('layout started');

        resolve();

        var layout = Remote;
        var self = this;
        var animateLayout = function(){
          requestAnimationFrame(animateLayout);
          layout.layout().then(data => {
            var updates = data.V;
            for(var update of updates){
              var elem = self.querySelector(`graph-vertex[data-layout-id="${update.id}"]`);
              elem.cube.position.set(update.x, update.y, update.z)
            }

          })
        }

        animateLayout();
      })
    });  
  }

  renderInitial(){
    var vs = this.querySelectorAll('graph-vertex');
    for(var v of vs){
      this.processAddVertex(v);
    }

    var es = this.querySelectorAll('graph-edge');
    for(var e of es){
      this.processAddEdge(e);
    }
  }

  setupControls(){
    var controls = new OrbitControls(this.camera, this.canvas);
    this.controls = controls;
    this.controls.update();
  }

  test(){

  }

  get width(){
    return this.getAttribute('width');
  }

  set width(val){
    this.setAttribute('width', val);
    
    this.setSize(val, this.height)
    if(this.canvas){
      this.resizeRenderer();
    }
    if(this.camera){
      this.resizeCamera();
    }
  }

  get height(){
    return this.getAttribute('height');
  }

  set height(val){
    this.setAttribute('height', val);
    this.setSize(this.width, val);
    if(this.canvas){
      this.resizeRenderer();
    }
    if(this.camera){
      this.resizeCamera();
    }
  }

  setupChildObserver(){
    console.log('observing dom tree')

    var config = {
      attributes: true,
      childList: true,
      subtree: true
    };

    var self = this;
    var moCallback = function(mutations){
      for(var mutation of mutations){
        switch(mutation.type){
          case 'childList':
            for(var added of mutation.addedNodes){
              if(added instanceof GraphVertex){
                self.processAddVertex(added)
              }

              if(added instanceof GraphEdge){
                self.processAddEdge(added);
              }
            }

            for(var removed of mutation.removedNodes){
              if(removed instanceof GraphVertex){
                self.processRemoveVertex(removed)
              }

              if(removed instanceof GraphEdge){
                self.processRemoveEdge(removed);
              }
            }

            break;

          case 'attributes':
            if(mutation.target instanceof GraphVertex){
              self.updateVertex(mutation.target, mutation.attributeName);
            }

            if(mutation.target instanceof GraphEdge){
              self.updateEdge(mutation.target, mutation.attributeName);
            }

            if(mutation.target instanceof GraphVisualization){
              try{
                console.log(mutation.attributeName, this.getAttribute(mutation.attributeName))
                self.layout.settings[mutation.attributeName.replace('-', '_')] = parseFloat(this.getAttribute(mutation.attributeName));
              }catch(_){
              }
            }
            break;
        }
      }
    };

    self.observer = new MutationObserver(moCallback);
    self.observer.observe(this, config);
  }

  setupResizeObserver(){
    this.ro = new ResizeObserver(entries => {
      for(var entry of entries){
        console.log(entry)
        this.onresize();
        if(this.camera){
          this.resizeCamera();
        }
      }
    });

    this.ro.observe(this);
  }

  /**
   * 
   */
  connectedCallback(){
    this.canvas = document.createElement('canvas');
    this.shadowRoot.appendChild(this.canvas);
    this.setupScene();
    this.setupCore()
    .then(this.setupChildObserver.bind(this));

    this.layout.started.then(() => {
      this.renderInitial();
    });
    this.setupResizeObserver();

    this.textureLoader = new THREE.TextureLoader();

    this.setupControls();

    var renderer = this.renderer,
      scene = this.scene,
      camera = this.camera,
      controls = this.controls;

    var animate = function () {
      requestAnimationFrame( animate );
      controls.update();
      renderer.render( scene, camera );
    };

    animate();
    
    document.addEventListener('dblclick', this.resolve_click.bind(this, 'dblclick'));
    document.addEventListener('click', this.resolve_click.bind(this, 'click'));


  }

  onresize(){
    this.camera.aspect = this.clientWidth / this.clientHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.clientWidth, this.clientHeight);
  }

  resolve_click(type, e){
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    
    // https://stackoverflow.com/a/23755254/5865620
    mouse.x = ( ( e.clientX - this.canvas.offsetLeft ) / this.canvas.width ) * 2 - 1;
    mouse.y = - ( ( e.clientY - this.canvas.offsetTop ) / this.canvas.height ) * 2 + 1;
    
    raycaster.setFromCamera(mouse, this.camera);
    var intersects = raycaster.intersectObjects(this.scene.children, true);

    if(intersects.length > 0){
      var event = new Event(type);
      var element = intersects[0].object.element;
      element.dispatchEvent(event);
    }else{
      var event = new Event(type);
      this.dispatchEvent(event);
    }

    // e.stopPropagation();
  }

  adoptedCallback(){
    this.connectedCallback();
  }

  disconnectedCallback(){
    var vertices = this.querySelectorAll('graph-vertex');
    var edges = this.querySelectorAll('graph-edge');

    for(var edge of edges){
      edge.disconnect();
    }

    for(var vertex of vertices){
      vertex.disconnect();
    }

    this.light.dispose();
    this.camera.dispose();
    this.renderer.dispose();
    this.scene.dispose();

    this.observer.disconnect();
    this.ro.disconnect();
  }

  attributeChangedCallback(attr, oldVal, newVal){
    switch(attr){
      case 'width':
        this.setSize(newVal, this.height);
        break;
      case 'height':
        this.setSize(this.width, newVal);
        break;
    }
  }

  set defaults(val){
    Object.assign(this._defaults, val);
  }

  get defaults(){
    return this._defaults;
  }

  async processAddVertex(elem){
    elem.setAttribute('data-layout-id', await this.layout.add_vertex());

    if(elem.face === null){
      elem.face = this.defaults.vertex.face;
    }

    if(elem.size === null){
      elem.size = this.defaults.vertex.size;
    }

    var geometry = new THREE.BoxGeometry(
      elem.size,
      elem.size,
      elem.size
    );

    if(!isValidColor(elem.face)){
      elem.texture = this.textureLoader.load( elem.face );
    }

    var material = new THREE.MeshBasicMaterial( 
      isValidColor(elem.face) ? { 'color': elem.face } : { 'map': elem.texture }
    );
    var cube = new THREE.Mesh( geometry, material );

    cube.position.set(
      Math.random() * 50,
      Math.random() * 50,
      Math.random() * 50
    );

    elem.cube = cube;
    cube.element = elem;

    this.scene.add( cube );

    var animateCube = function () {
      requestAnimationFrame( animateCube );
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      // cube.position.x += 0.1 * Math.random();
    };

    animateCube();
  }

  updateVertex(elem, prop){
    if(elem.cube){
      switch(prop){
        case 'face':
          if(elem.texture !== undefined){
            elem.texture.dispose();
          }

          elem.cube.material.dispose();

          if(elem.face === null){
            elem.face = this.defaults.vertex.face;
          }

          if(!isValidColor(elem.face)){
            if(elem.texture !== undefined){
              elem.texture.dispose();
              elem.cube.material.dispose();
            }

            elem.texture = this.textureLoader.load( elem.face );
            elem.cube.material = new THREE.MeshBasicMaterial({ map: elem.texture });
            elem.cube.material.needsUpdate = true;
          }else{
            elem.cube.material = new THREE.MeshBasicMaterial({ color: elem.face });
          }
          break;

        case 'size':
          if(elem.size === null){
            elem.size = this.defaults.vertex.size;
          }

          elem.cube.geometry.dispose();
          elem.cube.geometry = new THREE.BoxGeometry( elem.size, elem.size, elem.size );
          elem.cube.geometry.verticesNeedUpdate = true;
          break;

        case 'onclick':
          // donothing
          break;

        case 'dblclick':
          // donothing
          break;
      }
    }
  }

  updateEdge(elem, prop){
    switch(prop){
      case 'color':
        if(elem.color === null){
          elem.color = this.defaults.edge.color;
        }

        if(elem.line){
          elem.line.material.dispose();
          elem.line.material = new THREE.LineBasicMaterial({color: elem.color});
          elem.line.material.needsUpdate = true;
        }
        break;

      case 'strength':
        console.log('todo');
        break;
    }
  }

  processRemoveVertex(elem){
    console.log('removing edges');
    var edges = this.querySelectorAll(`graph-edge[source="#${elem.id}"]`);
    for(var edge of edges){
      this.removeChild(edge);
    }
    edges = this.querySelectorAll(`graph-edge[target="#${elem.id}"]`);
    for(var edge of edges){
      this.removeChild(edge);
    }

    console.log("removing vertex", elem.cube)
    this.scene.remove(elem.cube);
    if(elem.texture !== undefined){
      elem.texture.dispose();
    }
    elem.cube.material.dispose();
    elem.cube.geometry.dispose();
    this.layout.remove_vertex(parseInt(elem.getAttribute('data-layout-id')))
  }

  async processAddEdge(elem){
    if(elem.color === null){
      elem.color = this.defaults.edge.color;
    }

    if(elem.strength === null){
      elem.strength = this.defaults.edge.strength;
      elem.setAttribute('strength', elem.strength);
    }

    var material = new THREE.LineBasicMaterial({ color: elem.color });
    var geometry = new THREE.BufferGeometry();

    var source = this.querySelector(elem.getAttribute('source'));
    var target = this.querySelector(elem.getAttribute('target'));

    var source_layout_id = parseInt(source.getAttribute('data-layout-id'));
    var target_layout_id = parseInt(target.getAttribute('data-layout-id'));

    var id = await this.layout.add_edge({
      source: source_layout_id, 
      target: target_layout_id, 
      options: {
        directed: false, 
        strength: parseFloat(elem.strength)
      }
    });
    elem.setAttribute('data-layout-id', id);

    var positions = new Float32Array( 2 *3 );
    geometry.setAttribute('position', new THREE.BufferAttribute( positions, 3))

    // geometry.vertices.push(source.cube.position, target.cube.position);

    var line = new THREE.Line(geometry, material);
    line.frustumCulled = false;

    elem.line = line;
    this.scene.add(line);

    var animateLine = function () {
      requestAnimationFrame( animateLine );
      var positions = line.geometry.attributes.position.array;

      var i = 0
      positions[i++] = source.cube.position.x;
      positions[i++] = source.cube.position.y;
      positions[i++] = source.cube.position.z;

      positions[i++] = target.cube.position.x;
      positions[i++] = target.cube.position.y;
      positions[i++] = target.cube.position.z;

      line.geometry.attributes.position.needsUpdate = true;
    };

    animateLine();
  }

  processRemoveEdge(elem){
    console.log("removing edge", elem.line)
    this.scene.remove(elem.line);
    elem.line.material.dispose();
    elem.line.geometry.dispose();

    this.layout.remove_edge(parseInt(elem.getAttribute('data-layout-id')));
  }
}

customElements.define('graph-vertex', GraphVertex);
customElements.define('graph-edge', GraphEdge)
customElements.define('graph-visualization', GraphVisualization);