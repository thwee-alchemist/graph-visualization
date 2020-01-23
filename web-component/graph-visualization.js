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
    this._onclick = undefined;
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

  get onclick(){
    return this._onclick;
  }

  set onclick(val){
    this._onclick = val;
    this.setAttribute('onclick', val);
  }
}


class GraphEdge extends HTMLElement {
  constructor(){
    super();

    this._color = undefined;
    this._strength = undefined;
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
              self.updateVertex(mutation.target, mutation.attributeName);
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

    this.textureLoader = new THREE.TextureLoader();
    document.addEventListener('click', this.resolve_click.bind(this), false);

  }

  resolve_click(e){
    var bounds = $(this).offset();
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    
    // https://stackoverflow.com/a/23755254/5865620
    mouse.x = ( ( e.clientX - this.canvas.offsetLeft ) / this.canvas.width ) * 2 - 1;
    mouse.y = - ( ( e.clientY - this.canvas.offsetTop ) / this.canvas.height ) * 2 + 1;
    
    raycaster.setFromCamera(mouse, this.camera);
    var intersects = raycaster.intersectObjects(this.scene.children, true);

    if(intersects.length > 0){
      var event = new Event('click');
      console.log('intersected', intersects[0])

      var element = intersects[0].object.element;
      var temp = element.face;
      element.face = "black";

      setTimeout(() => {
        element.face = temp;
      }, 250)
      element.dispatchEvent(event);
    }

    e.stopPropagation();
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

    elem.texture = this.textureLoader.load( elem.face );

    var material = new THREE.MeshBasicMaterial( 
      isValidUrl(elem.face) ? { 'map': elem.texture } : { 'color': elem.face } 
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
    switch(prop){
      case 'face':
        if(elem.texture !== undefined){
          elem.texture.dispose();
        }

        elem.cube.material.dispose();

        if(isValidUrl(elem.face)){
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
        elem.cube.geometry.dispose();
        elem.cube.geometry = new THREE.BoxGeometry( elem.size, elem.size, elem.size );
        elem.cube.geometry.verticesNeedUpdate = true;
        break;

      case 'onclick':
        // donothing
        break;
    }
  }

  processRemoveVertex(elem){
    console.log("removing vertex", elem.cube)
    this.scene.remove(elem);
    elem.cube.material.dispose();
    elem.cube.geometry.dispose();
  }

  processAddEdge(elem){
    if(elem.color === undefined){
      elem.color = this.defaults.edge.color;
    }

    if(elem.strength === undefined){
      elem.strength = this.defaults.edge.strength;
    }

    var material = new THREE.LineBasicMaterial({ color: elem.color });
    var geometry = new THREE.BufferGeometry();

    var source = this.querySelector(elem.source);
    var target = this.querySelector(elem.target);

    var positions = new Float32Array( 2 *3 );
    geometry.setAttribute('position', new THREE.BufferAttribute( positions, 3))

    // geometry.vertices.push(source.cube.position, target.cube.position);

    var line = new THREE.Line(geometry, material);
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

    elem.line = line;
  }

  processRemoveEdge(elem){

  }
}

customElements.define('graph-vertex', GraphVertex);
customElements.define('graph-edge', GraphEdge)
customElements.define('graph-visualization', GraphVisualization);