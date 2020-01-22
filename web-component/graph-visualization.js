class GraphVertex extends HTMLElement {
  constructor(size=10, face="black", ){
    super();

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
    var style = this.shadowRoot.querySelector('style.default');

    if(style){
      this.shadowRoot.removeChild(style);
    }

    var styleTemplate = document.createElement('template');
    styleTemplate.innerHTML = `
    <style>
    :host {
      display: block;
      width: ${width};
      height: ${height};
      margin: 0;
      padding: 0;
      border: 1px dashed black;
      resize: both;
    }
    </style>`;

    var style = styleTemplate.content.cloneNode(true);

    this.canvas.width = this.clientWidth;
    this.canvas.height = this.clientHeight;

    this.canvas.style.width = this.clientWidth + "px";
    this.canvas.style.height = this.clientHeight + 'px';

    this.shadowRoot.appendChild(style);
  }

  /**
   * Precondition:
   * - this.renderer is renderer is assigned a renderer
   * - this.canvas is assigned a canvas
   * 
   * Optional Preconditions
   * - this.camera can either be defined or undefined
   * 
   * Postcondition:
   * - scene is set to canvas's size
   * - camera perspective is considers canvas' size
   * - renderer size is set.
   */
  adjustSceneSize(){
    if(this.camera !== undefined){
      this.scene.remove(this.camera);
      delete this.camera;
    }

    this.setSize(
      this.clientWidth,
      this.clientHeight
    )

    this.camera = new THREE.PerspectiveCamera( 75, this.clientWidth / this.clientHeight, 0.1, 1000 );
    this.scene.add(this.camera);

    this.camera.position.set(0, 0, -5);
    this.camera.lookAt(0, 0, 0);
    
    // resize the canvas
    this.renderer.setSize( this.clientWidth, this.clientHeight );
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
    this.scene.autoUpdate = true;

    this.light = new THREE.AmbientLight( 0x404040 );
    this.scene.add(this.light);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });

    this.renderer.setSize(this.clientWidth, this.clientHeight);

    // this.renderer.setClearColor(0x000000, 0.0)
    this.renderer.setClearAlpha(0.0)
  }

  test(){
    var geometry = new THREE.BoxGeometry( 10, 10, 10 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    var cube = new THREE.Mesh( geometry, material );
    cube.position.set(0,0,0)
    this.scene.add( cube );

    var renderer = this.renderer,
      scene = this.scene,
      camera = this.camera;

    camera.position.set()

    var animate = function () {
      requestAnimationFrame( animate );

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render( scene, camera );
    };

    animate();

    this.cube = cube;
  }

  /**
   * 
   */
  connectedCallback(){

    this.style.width = this.getAttribute('width');
    this.style.height = this.getAttribute('height');
    
    // setup canvas
    this.canvas = document.createElement('canvas');
    this.shadowRoot.appendChild(this.canvas);

    this.setupScene();
    this.adjustSceneSize();

    // setup observer
    var config = {
      attributes: true,
      childList: true,
      subtree: true
    };

    var moCallback = function(mutations, observer){
      for(var mutation of mutations){
        switch(mutation.type){
          case 'childList':
            console.log('child added or removed', mutation);

            for(var added of mutation.addedNodes){
              console.log('added: ', added);
            }

            for(var removed of mutation.removedNodes){
              console.log('removed', removed);
            }
            break;

          case 'attributes':
            console.log('attribute changed: ', mutation.attributeName);
            break;
        }
      }
    }

    this.observer = new MutationObserver(moCallback);
    this.observer.observe(this, config);
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

  addVertex(){
    var vertex = document.createElement('graph-vertex')
    this.appendChild(vertex);

    return vertex;
  }
}

customElements.define('graph-visualization', GraphVisualization);