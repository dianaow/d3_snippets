var canvasDim = { width: 1000, height: 1000 }
var margin = {top: 0, right: 0, bottom: 0, left: 0}
var width = canvasDim.width - margin.left - margin.right
var height = canvasDim.height - margin.top - margin.bottom

var root

var force = d3.layout.force()
    .size([width, height])
    .on("tick", tick);

var svg = d3.select(".modal-content").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr('transform', 'translate(100, 20)')

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

run()

function run() {
  d3.json("./data/dummy_data1.json", function(error, json) {
    if (error) throw error;

    root = json;
    flatten(root); //to set ids
    setParents(root, null);
    collapseAll(root);
    root.children = root._children;
    root._children = null;

    execute(function() {
     update()
     execute(function() {
       animate()
        execute(function() {
         animate()
          execute(function() {
            animate()
          });
        });
     });
    });

  });
}

function update() {
  var nodes = flatten(root),
      links = d3.layout.tree().links(nodes);

  nodes.forEach(function(d) {
    if(d.name=='flare') {
      d.x = width/2, d.y = height/2;
      d.fixed = true;
    }
  })
  
  function isInArray(value, array) {
    return array.indexOf(value) > -1;
  }

  // Restart the force layout.
  var arr = ["flare", "display", "flex", "data", "query", "animate", "vis", "analytics", "physics", "scale", "util"]
  force
      .nodes(nodes)
      .links(links)
      .charge(function(d) {
        return arr.includes(d.name) ? -1000 :  -20
      })
      .linkDistance(function(d) {
        return d.source.name!='flare' ? height/40 + (Math.random() * 50) : height/10 + (Math.random() * 100)
      })
      .linkStrength(0.8)
      .gravity(function(d) {       
        return arr.includes(d.name) ? 0.1 : 0.2
      })
      .friction(0.2)
      .start();

  // Update the links.
  link = link.data(links, function(d) { return d.target.id; });

  // Exit any old links.
  link.exit().remove();

  // Enter any new links.
  link.enter().insert("line", ".node")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  // Update the nodes…
  node = node.data(nodes, function(d) { return d.id; }).style("fill", color);

  // Exit any old nodes.
  node.exit().remove();

  // Enter any new nodes.
  node.enter().append("circle")
      .attr("class", "node")
      .attr("id", function(d) { return d.name })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return 5 })
      .style("fill", color)
      .on("click", click)
      .call(force.drag);

}

function tick() {

  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })

}

// Color leaf nodes
function color(d) {
  return d._children ? "grey" : d.children ? "#081EFF" : "#081EFF";
}

// Returns a list of all nodes under the root.
function flatten(root) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }

  recurse(root);
  return nodes;
}

function setParents(d, p){
    d._parent = p;
  if (d.children) {
      d.children.forEach(function(e){ setParents(e,d);});
  } else if (d._children) {
      d._children.forEach(function(e){ setParents(e,d);});
  }
}

function collapseAll(d){
    if (d.children){
        d.children.forEach(collapseAll);
        d._children = d.children;
        d.children = null;
    }
    else if (d._children){
        d._children.forEach(collapseAll);
    }
}

// Toggle children on click.
function click(d) {
  if (d3.event.defaultPrevented) return; // ignore drag
  if (d.children) {
    console.log("a")
    d.children = d._children;
    d._children = null;
    collapseAll(d)
  } else {
      if (d._parent){
          console.log("b")
          d._parent.children.forEach(function(e){
              if (e == d){
                d.children = d._children;
              }
          });
      }
  }
  update();
}


function execute(callback) {
  setTimeout(function() {
    callback();
  }, 1000);
}

function animate() {

  d3.selectAll('.node').each(function(d) {
    setTimeout(expand(d), 1000)

    function expand(d) {
      if (d._parent){
        d._parent.children.forEach(function(e){
            if (e == d){
                  d.children = d._children;
            }
        });
      }
      update();
    }

  })

}