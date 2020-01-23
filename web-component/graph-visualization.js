// https://stackoverflow.com/a/43467144/5865620
var isValidUrl = (string) => {
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
  }

  

  connectedCallback(){
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


class GraphEdge extends HTMLElement {
  constructor(){

  }

  connectedCallback(){
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
        color: 'black'
      }
    }
  }

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

  test(){
    var renderer = this.renderer,
      scene = this.scene,
      camera = this.camera,
      cube = this.cube; // todo remove

    var animate = function () {
      requestAnimationFrame( animate );
      renderer.render( scene, camera );
    };

    animate();

    this.cube = cube;
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
    var config = {
      attributes: true,
      childList: true,
      subtree: true
    };

    var self = this;
    var moCallback = function(mutations, observer){
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
              self.updateVertex(mutation.target);
            }
            break;
        }
      }
    }

    this.observer = new MutationObserver(moCallback);
    this.observer.observe(this, config);
  }

  setupResizeObserver(){
    this.ro = new ResizeObserver(entries => {
      for(var entry of entries){
        this.setSize(entry.contentRect.width + 'px', entry.contentRect.height + 'px')
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
    this.setupChildObserver();
    // this.setupResizeObserver();

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

  processAddVertex(elem){
    if(elem.face === undefined){
      elem.face = this.defaults.vertex.face;
    }

    if(elem.size === undefined){
      elem.size = this.defaults.vertex.size;
    }

    var geometry = new THREE.BoxGeometry(
      elem.size,
      elem.size,
      elem.size
    );

    var material = new THREE.MeshBasicMaterial( 
      isValidUrl(elem.face) ? { 'map': new THREE.TextureLoader().load( elem.face ) } : { 'color': elem.face } 
    );
    var cube = new THREE.Mesh( geometry, material );

    cube.position.set(
      Math.random(),
      Math.random(),
      Math.random()
    );

    elem.cube = cube;

    this.scene.add( cube );

    var animateCube = function () {
      requestAnimationFrame( animateCube );
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
    };

    animateCube();
  }

  updateVertex(elem){
    elem.cube.material = new THREE.MeshBasicMaterial( 
      isValidUrl(elem.face) ? { 'map': new THREE.TextureLoader().load( elem.face ) } : { 'color': elem.face } 
    );
    elem.cube.material.needsUpdate = true;
  }

  processRemoveVertex(elem){

  }

  processAddEdge(elem){

  }

  processRemoveEdge(elem){

  }
}

customElements.define('graph-vertex', GraphVertex);
customElements.define('graph-edge', GraphEdge)
customElements.define('graph-visualization', GraphVisualization);