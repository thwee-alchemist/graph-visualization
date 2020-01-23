# graph-visualization
(incomplete as of January 22nd, 2020)

This will become a web component, force directed graph visualization. 

## Target Usage: 
```html
<graph-visualization
  width="100%"
  height="350px">

  <graph-vertex id="home" size="10" face="url(home.png)">Home</vertex>
  <graph-vertex 
    id="new" 
    size="10" 
    face="green">New...</vertex>

  <graph-edge source="home" target="new" color="black" />
</graph-visualization>
```
