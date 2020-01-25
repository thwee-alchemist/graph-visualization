    // setup observer
    var config = {
      attributes: false,
      childList: true,
      subtree: true
    };

    var self = this;
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
            console.log('attribute changed', mutation)
        }
      }
    }

    this.observer = new MutationObserver(moCallback);
    this.observer.observe(this, config);

    this.ro = new ResizeObserver(entries => {
      for(var entry of entries){
        console.log('observing the canvas:', entry);
        this.setAttribute('width', entry.contentRect.width);
        this.setAttribute('height', entry.contentRect.height)
      }
    });

    this.ro.observe(this);

    Scene, AmbientLight, WebGLRenderer, PerspectiveCamera, TextureLoader, Raycaster, Vector2, BoxGeometry, MeshBasicMaterial, Mesh, LineBasicMaterial, BufferGeometry, BufferAttribute, Line