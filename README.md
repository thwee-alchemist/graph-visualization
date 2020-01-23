# graph-visualization

a web component, force directed graph visualization

This is the January 2020 rewrite of fourd, incorporating lessons learned from [fourd.cpp.js](https://github.com/thwee-alchemist/fourd.cpp.js), and [dynamic-graph](https://github.com/thwee-alchemist/dynamic-graph). Emphasis will be placed on development hygiene:

* Thorough design

  * A clean web component that can be styled like any other element

  * HTML elements for vertices and edges

* A clean build process with a single, non-confusing point of entry

**This isn't done yet. As of January 22nd, this still misses all the mathy calculations, as well as Labels for vertices and edges!**

## Building

```
todo
```

## Testing

```
todo
```

## Usage

### Web Server Configuration

Add the web assembly mime type to your web server.

#### Apache

On Apache, add the following lines to your configuration:

```
AddType application/wasm .wasm
AddOutputFilterByType DEFLATE application/wasm
```

#### Python 2

You can also use python's SimpleHTTPServer for testing purposes:

```py
import BaseHTTPServer, SimpleHTTPServer
 
port=8000
print "Running on port %d" % port
 
SimpleHTTPServer.SimpleHTTPRequestHandler.extensions_map['.wasm'] ='application/wasm'
 
httpd = BaseHTTPServer.HTTPServer(('localhost', port), SimpleHTTPServer.SimpleHTTPRequestHandler)
 
print "Mapping \".wasm\" to \"%s\"" % SimpleHTTPServer.SimpleHTTPRequestHandler.extensions_map['.wasm']
httpd.serve_forever()
```

Save the above script to a file named something like "server.py" and run it using python2 (sorry!).

#### NodeJS

The following script serves web assembly over a secure connection using node.js

```js
#!/usr/bin/env node

const tls = require('tls');

tls.DEFAULT_MAX_VERSION = tls.DEFAULT_MAX_VERSION;

const fs = require('fs')
const https = require('https')

const express = require('express')
const favicon = require('serve-favicon')
const path = require('path')
const app = express()

express.static.mime.define({
  'wasm': 'application/wasm',
  'js': 'application/javascript',
  'css': 'text/css'
})

app.use(favicon(path.join(__dirname, 'test', 'favicon.ico')))
app.use('/', express.static(path.join(__dirname, 'test' )))

var credentials = {
  key: fs.readFileSync('/etc/ssl/localcerts/localhost.key'),
  cert: fs.readFileSync('/etc/ssl/localcerts/localhost.pem')
}

const server = https.createServer(credentials, app)

const port = 443
server.listen(port)
console.log(`Visit https://localhost:${port}/`)
```

### HTML Elements

This library makes available three kinds of HTML elements: A <graph-visualization> tag, which can contain 0 or more <vertex>- and <edge>-elements.

HTML elements are easier to learn than Javascript, so I can facilitate user adoption by shifting the API towards HTML as opposed to Javascript.

#### <graph-visualization>

The graph-visualization element contains the vertex and edge elements inside of it, and defines some properties for the visualization itself.

##### Sample Usage

```html
<graph-visualization 
   width="500px"
   height="350px"
   background-color="cornflowerblue">
</graph-visualization>
```

##### Attributes

###### width

(required)

The width of the element. Any valid CSS width should do.

###### height

(required)

The height of the graph visualization element. Any valid CSS height should do.

###### default-vertex-size

If a particular vertex doesn't set a size, this value is used.

###### default-vertex-face

Default face for a vertex.

###### default-edge-color

Default edge color

###### default-edge-strength

Default edge strength.

#### <graph-vertex>

The vertex element encapsulates the information necessary to draw a vertex inside of the graph visualization.

##### Sample Usage

```js
var graph = document.querySelector('graph-visualization');

var vertex1 = document.createElement('graph-vertex');
vertex1.id = 'home';
vertex1.face = 'https://picsum.photos/200/300';
vertex1.addEventListener('click', function(e){
  console.log(e.target.id, 'clicked');
});

var vertex2 = document.createElement('graph-vertex');
vertex2.id = 'menu';
vertex2.face = 'black';

graph.appendChild(vertex1);
graph.appendChild(vertex2);

// later:

vertex2.remove();

vertex1.size = 50;
vertex1.face = 'blue'
```

##### Attributes

###### size

This is the size the vertex will be rendered in. These are not exactly pixels, but 3D pixels. Their actual size depends on their position in the 3D scene.

###### face

Can be either a color or a url for an image.

###### click event

#### <graph-edge>

The edge element connects two vertices logically and visually.

##### Sample Usage

```js
var graph = document.querySelector('graph-visualization');

var edge = document.createElement('graph-edge');
edge.source = '#home';
edge.target = '#menu';
edge.color = 'black';
edge.strength = 1.0;

graph.appendChild(edge);

// later...
edge.color = "white";

// and ...
edge.remove();
```

##### Attributes

###### source

The id of a vertex.

###### target

The id of a vertex.

###### color

What color should the edge be?

###### strength

How much should the edge pull the vertices together?

### Example

```html
<graph-visualization
  width="500px"
  height="350px"
  background-color="cornflowerblue">

  <graph-vertex id="home" size="10" face="https://localhost/home.png)">Home</graph-vertex>
  <graph-vertex id="menu" size="10" face="green"></graph-vertex>

  <graph-edge source="#home" target="#menu" color="black"></graph-edge>
</graph-visualization>
```

# Todo
Labels, Math