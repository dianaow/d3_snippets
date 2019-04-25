
///////////////////////////////////////////////////////////////////////////
//////////////////// Set up and initiate svg containers ///////////////////
/////////////////////////////////////////////////////////////////////////// 
var margin = {
  top: 500,
  right: 10,
  bottom: 10,
  left: 10
};
var totalWidth = 1250;
var totalHeight = 1200;
var width = totalWidth - margin.left - margin.right;
var height = totalHeight - margin.top - margin.bottom;

//Canvas
var canvasLinks = d3.select('#chart').append("canvas").attr('class', 'canvas-links')
var ctxLinks = canvasLinks.node().getContext("2d")
var sf = Math.min(2, getPixelRatio(ctxLinks)) //no more than 2
if(screen.width < 500) sf = 1 //for small devices, 1 is enough

canvasLinks
  .attr('width', sf * totalWidth)
  .attr('height', sf * totalHeight)
  .style('width', totalWidth + "px")
  .style('height', totalHeight + "px")

ctxLinks.scale(sf,sf);
ctxLinks.translate(margin.left + width/2, margin.top);

var canvasNodes = d3.select('#chart').append("canvas").attr('class', 'canvas-nodes')
canvasNodes
  .attr('width', sf * totalWidth)
  .attr('height', sf * totalHeight)
  .style('width', totalWidth + "px")
  .style('height', totalHeight + "px")

var ctxNodes = canvasNodes.node().getContext("2d")
ctxNodes.scale(sf,sf);
ctxNodes.translate(margin.left + width/2, margin.top);

// Another canvas layer just to ovelay captions
var canvasCaptions = d3.select('#chart').append("canvas").attr('class', 'canvas-captions')
var ctxCaptions = canvasCaptions.node().getContext("2d")
canvasCaptions
  .attr('width', sf * totalWidth)
  .attr('height', sf * totalHeight)
  .style('width', totalWidth + "px")
  .style('height', totalHeight + "px")

ctxCaptions.scale(sf,sf);
ctxCaptions.translate(margin.left + width/2, margin.top);

var linkedByIndex = {},
    linkedToID = {},
    nodeByID = {};

//SVG container
var svg = d3.select('#chart')
  .append("svg")
  .attr("width", totalWidth)
  .attr("height", totalHeight)

var g = svg
  .append("g")
  .attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top) + ")scale(1, 1)")
  .style("isolation", "isolate");
 
var hoverRect = g.append("rect")
  .attr("class","hoverRect")
  .attr("x", -width/2 - margin.left)
  .attr("y", -margin.top)
  .attr("width", totalWidth)
  .attr("height", totalHeight)


///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create scales ///////////////////////////////
///////////////////////////////////////////////////////////////////////////
var colorScale = d3.scaleLinear()
  .domain([1, 8, 17])
  .range(['red', 'lightyellow', 'blue'])
  .interpolate(d3.interpolateHcl); 

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Set-up voronoi //////////////////////////////
///////////////////////////////////////////////////////////////////////////
var voronoi = d3.voronoi()
  .x(function(d) { return d.x; })
  .y(function(d) { return d.y; })
  .extent([[-margin.left - width/2, -margin.top], [width/2 + margin.right, height + margin.bottom]]);
  
var diagram;

///////////////////////////////////////////////////////////////////////////
////////////////////////////// Force simulation ///////////////////////////
///////////////////////////////////////////////////////////////////////////
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().distance(50).strength(0.5))
    .force("charge", d3.forceManyBody(-200))
    //.force('center', d3.forceCenter(width/2, height/2))
    .stop()

///////////////////////////////////////////////////////////////////////////
////////////////////////////// Mouse events ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

//Variables needed to disrupt mouseover loop
var repeatSearch;
var connectionsLooper;
var startSearch;
var doMouseOut = true;
var stopMouseout;
var counter = 0;
var mouseOverDone = false;

var selectedNodes = {},
    selectedNodeIDs = [],
    oldLevelSelectedNodes;

var clickLocked = false;
var pathLocked = false;

///////////////////////////////////////////////////////////////////////////
//////////////////////////// Read in the data /////////////////////////////
///////////////////////////////////////////////////////////////////////////
d3.json("./data/groups2.json", function(error, json) {

  var links = json.links
  var nodes = json.nodes

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Create links ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  links.forEach(function(d) {
  
    linkedByIndex[d.source + "," + d.target] = true;

    //Save all of the links to a specific node
    if(!linkedToID[d.source]) linkedToID[d.source] = [];
    if(!linkedToID[d.target]) linkedToID[d.target] = [];
    linkedToID[d.source].push(d.target); 
    linkedToID[d.target].push(d.source); 
    d.opacity = 0.3;
    d.sign = Math.random() > 0.5;
  });

  linkSave = links;

  ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Create nodes ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  //Prepare the node data
  nodes.forEach(function(d,i) { 
    nodes[i].id = i
  })

  nodes.forEach(function(d) { 

    d.radius = 5;
    if (d.group == "Group") { d.radius = 10; }

    d.fill = colorScale(d.group)
    if (d.group == "Group") { d.fill = 'lightyellow'; }

    d.opacity = 1

    nodeByID[d.id] = d;
  });

  nodesSave = nodes;
  

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////// Run simulation ///////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  
  //umm....there is a flying node that needs to be fixed.
  //var sourceids = links.map(d=>d.source)
  //var targetids = links.map(d=>d.target)
  //nodes = nodes.filter(function(d){ return sourceids.indexOf(d.id) > -1 || targetids.indexOf(d.id) > -1 })

  simulation.nodes(nodes).on("tick", function() {
    drawLinks(links);
    drawNodes(nodes);
  })
  simulation.force('link').links(links)
  simulation.alpha(1).restart();

  diagram = voronoi(nodes)


  ///////////////////////////////////////////////////////////////////////////
  /////////////////////// Capture mouse events //////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  var currentHover = null;

  //hoverRect.on("mousemove", function() {
    //d3.event.stopPropagation();

    //Find the nearest person to the mouse, within a distance of X pixels
    //var m = d3.mouse(this);
    //var found = diagram.find(m[0], m[1], 10);
    //console.log(found)
    //if (found) { 
      //simulation.stop()
      //d3.event.preventDefault();
      //mouseOvered(found.data, nodes); 
    //} else { 
      //mouseOut() 
    //} 

    //currentHover = found;
  //})

  ///////////////////////////////////////////////////////////////////////////
  ///////////////// Selective nodes and links highlight /////////////////////
  ///////////////////////////////////////////////////////////////////////////
  function hop1() {

    var nodesToHighlight = [153, 280, 284]
    var labels = ['Shareholder X', "Company A", "Company B"]
    nodesSave
      .filter(function(d) { return nodesToHighlight.indexOf(d.id) > -1; })
      .forEach(function(d,i) {
        ctxNodes.globalAlpha = 0.5;
        ctxNodes.fillStyle = "navy";
        ctxNodes.fillRect(d.x+16, d.y-15, 120, 30);

        ctxNodes.globalAlpha = 1;
        ctxNodes.font = "20px Helvetica";
        ctxNodes.fillStyle =  'white'
        ctxNodes.fillText(labels[i], d.x+16, d.y+10);

        ctxNodes.shadowBlur = 0
        ctxNodes.shadowColor = 'white'
        ctxNodes.beginPath();
        ctxNodes.moveTo(d.x + d.radius, d.y);
        ctxNodes.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
        ctxNodes.fill();
        ctxNodes.closePath();
      });

  }

  function hop2() {

    var nodesToHighlight = [150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 170, 179, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206]
    var labels = ["Person A", "Person B", "Person C"]
    nodesSave
      .filter(function(d) { return nodesToHighlight.indexOf(d.id) > -1; })
      .forEach(function(d,i) {
        if(labels[i]) { 
          ctxNodes.globalAlpha = 0.5;
          ctxNodes.fillStyle = "navy";
          ctxNodes.fillRect(d.x+8, d.y-14, 60, 20);

          ctxNodes.globalAlpha = 1;
          ctxNodes.font = "14px Helvetica";
          ctxNodes.fillStyle = "white";
          ctxNodes.fillText(labels[i] ? labels[i] : "", d.x+10, d.y);
        }
        
        ctxNodes.shadowBlur = 0
        ctxNodes.shadowColor = 'white'
        ctxNodes.beginPath();
        ctxNodes.moveTo(d.x + d.radius, d.y);
        ctxNodes.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
        ctxNodes.fill();
        ctxNodes.closePath();
      });

    var mainNode = [280, 284]
    linkSave
      .filter(function(d) { return mainNode.indexOf(d.source.id) > -1 || mainNode.indexOf(d.target.id) > -1; })
      .forEach(function(d) {
        //ctxLinks.globalAlpha = 0.2;
        //ctxLinks.fillStyle = "darkred";
        //ctxLinks.fillRect(d.source.x + (d.target.x - d.source.x)/2 + 10, d.source.y + (d.target.y - d.source.y)/2, 100, 20);

        //ctxLinks.font = "16px Helvetica";
        //ctxLinks.fillStyle = "lightyellow";
        //ctxLinks.fillText("", d.source.x + (d.target.x - d.source.x)/2 + 10, d.source.y + (d.target.y - d.source.y)/2);

        ctxLinks.strokeStyle = "white";
        ctxLinks.lineWidth = 3; 
        ctxLinks.globalAlpha = 0.8;
        ctxLinks.beginPath();
        drawCircleArc(d.center, d.r, d.source, d.target, d.sign);
        ctxLinks.stroke();
        ctxLinks.closePath();
      })

  }

  function hop3() {

    var nodesToHighlight = [15, 30, 45, 60, 75, 125]

    nodesSave
      .filter(function(d) { return nodesToHighlight.indexOf(d.id) > -1; })
      .forEach(function(d,i) {
        ctxNodes.shadowBlur = 0
        ctxNodes.shadowColor = 'white'
        ctxNodes.beginPath();
        ctxNodes.moveTo(d.x + d.radius*1.4, d.y);
        ctxNodes.arc(d.x, d.y, d.radius*1.4, 0, 2 * Math.PI);
        ctxNodes.fill();
        ctxNodes.closePath();
      });
  }

  function hop4() {

    var nodesToHighlight = [153, 280, 284]
    var colors = ["red", "#d9d9d9", "#969696"]
    var threeNodes = nodesSave.filter(function(d) { return nodesToHighlight.indexOf(d.id) > -1; })
    threeNodes.forEach((d,i)=>{
      d.color = colors[i]
    })

    gCircle = g.selectAll('.infected').data(threeNodes)

    gCircle
      .enter().append('circle')
        .attr('class', "infected")
        .attr("fill", "white") 
        .attr("cx", d=> d.x+d.radius/4-2)
        .attr("cy", d=> d.y+d.radius/4-2)
        .attr('r', d=>d.radius)
        .merge(gCircle)
        .transition().ease(d3.easeCubicOut).duration(1000)
        .attr("cx", d=> d.x+d.radius/4-2)
        .attr("cy", d=> d.y+d.radius/4-2)
        .attr('r', d=>d.radius*1.4)
        .attr("fill", d=> d.color) 
        .attr("fill-opacity", 1)
        .attr('stroke', "black")
        .attr('stroke-width', "3px")

    // highlight the links
    var mainNode = [153]
    linkSave
      .filter(function(d) { return mainNode.indexOf(d.source.id) > -1 || mainNode.indexOf(d.target.id) > -1; })
      .forEach(function(d) {
        //ctxLinks.globalAlpha = 1;
        //ctxLinks.font = "16px Helvetica";
        //ctxLinks.fillStyle = "white";
        //ctxLinks.fillText("Affliated", d.source.x + (d.target.x - d.source.x)/2 + 14, d.source.y + (d.target.y - d.source.y)/2+8);

        ctxLinks.strokeStyle = "white";
        ctxLinks.lineWidth = 3; 
        ctxLinks.beginPath();
        drawCircleArc(d.center, d.r, d.source, d.target, d.sign);
        ctxLinks.stroke();
        ctxLinks.closePath();
      })

    // Title
    ctxCaptions.globalAlpha = 1;
    ctxCaptions.font = "22px Helvetica";
    ctxCaptions.fillStyle = "lightyellow";
    ctxCaptions.fillText("With knowledge graphs, we identify risk levels of entities", -margin.left - width/2 + 100, -margin.top + 300);

  }

  function hop5() {

    var nodesToHighlight = [153, 280, 284]
    var labels = ['Shareholder X', "Company A", "Company B"]

    var zoom = d3.zoom()
        .on("zoom", zoomed);

    ctxLinks.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
    ctxNodes.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);

    d3.select(".canvas-nodes").transition()
      .duration(1000)
      .call(zoom.transform, transform)
      .call(transition);

    function zoomed() { //zoom is buggy
      ctxNodes.save();
      ctxNodes.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
      ctxNodes.translate(d3.event.transform.x, d3.event.transform.y);
      ctxNodes.scale(d3.event.transform.k, d3.event.transform.k);
      nodesSave
        .filter(function(d) { return nodesToHighlight.indexOf(d.id) > -1; })
        .forEach(function(d,i) {
          ctxNodes.shadowBlur = 0
          ctxNodes.shadowColor = 'white'
          ctxNodes.beginPath();
          ctxNodes.moveTo(d.x + d.radius*1.4, d.y);
          ctxNodes.arc(d.x, d.y, d.radius*1.4, 0, 2 * Math.PI);
          ctxNodes.fill();
          ctxNodes.closePath();
        });
        
      ctxNodes.restore();
    }

    function transform() {
      return d3.zoomIdentity
          .translate(-width/2, height/2)
          .scale(2)
    }

    function transition(canvas) {
      if(canvas){
        canvas.transition()
            .delay(500)
            .duration(3000)
            .call(zoom.transform, transform)
            .on("end", function() { canvas.call(transition); });
      }
    }

  }

  execute_short(function() {
    simulation.stop()
    hop1()
    execute(function() {
      hop2()
      execute(function() {
        hop3()
        execute(function() {
          hop4()
          //execute(function() {
            //hop5()
          //})
        })
      })
    })
  })

  ///////////////////////////////////////////////////////////////////////////
  ///////////////// Run animation (Highlight + zoom out) ////////////////////
  ///////////////////////////////////////////////////////////////////////////
  //execute(function() {
    //simulation.stop()
    //runAnimation()
  //})

  function runAnimation() {
    var startPoint = diagram.find(-22, -14, 10)
    mouseOvered(startPoint.data, nodes);
    //var zoom = d3.zoom().on("zoom", zoomed) 
    //setTimeout(function() {
      //d3.selectAll('#chart')
        //.call(zoom.transform, transform)
        //.call(transition)
    //}, 2200)
  }


})


///////////////////////////////////////////////////////////////////////////
/////////////////////////////// Draw the nodes ////////////////////////////
///////////////////////////////////////////////////////////////////////////

function drawNodes(nodes, opacity, fill) {
  ctxNodes.save()
  ctxNodes.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
  nodes.forEach(function(d) {
    ctxNodes.beginPath();
    ctxNodes.moveTo(d.x + d.radius, d.y);
    ctxNodes.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
    ctxNodes.globalAlpha = 0.3;
    ctxNodes.fillStyle = "#d4d4d4";
    ctxNodes.shadowBlur = d.group=='Group' ? 30 : 15;
    ctxNodes.shadowColor = "#d4d4d4";
    ctxNodes.fill();
    ctxNodes.closePath();
  });
  ctxNodes.shadowBlur = 0;
  ctxNodes.restore()
}//function drawNodes

///////////////////////////////////////////////////////////////////////////
/////////////////////////////// Draw the links ////////////////////////////
///////////////////////////////////////////////////////////////////////////

function drawLinks(links) {
  ctxLinks.save()
  ctxLinks.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
  links.forEach(function(d) {
    //Find a good radius
    d.r = Math.sqrt(sq(d.target.x - d.source.x) + sq(d.target.y - d.source.y)) * 2;
    //Find center of the arc function
    var centers = findCenters(d.r, d.source, d.target);
    d.center = d.sign ? centers.c2 : centers.c1;

    ctxLinks.strokeStyle = "#d4d4d4";
    ctxLinks.lineWidth = 1.5;
    ctxLinks.globalAlpha = 0.3;
    ctxLinks.beginPath();
    drawCircleArc(d.center, d.r, d.source, d.target, d.sign);
    ctxLinks.stroke();
  })//forEach
  ctxLinks.restore()
}//function drawLinks

//https://stackoverflow.com/questions/26030023/draw-arc-initial-point-radius-and-final-point-in-javascript-canvas
//http://jsbin.com/jutidigepeta/3/edit?html,js,output
function findCenters(r, p1, p2) {
  // pm is middle point of (p1, p2)
  var pm = { x : 0.5 * (p1.x + p2.x) , y: 0.5*(p1.y+p2.y) } ;
  // compute leading vector of the perpendicular to p1 p2 == C1C2 line
  var perpABdx= - ( p2.y - p1.y );
  var perpABdy = p2.x - p1.x;
  // normalize vector
  var norm = Math.sqrt(sq(perpABdx) + sq(perpABdy));
  perpABdx/=norm;
  perpABdy/=norm;
  // compute distance from pm to p1
  var dpmp1 = Math.sqrt(sq(pm.x-p1.x) + sq(pm.y-p1.y));
  // sin of the angle between { circle center,  middle , p1 } 
  var sin = dpmp1 / r ;
  // is such a circle possible ?
  if (sin<-1 || sin >1) return null; // no, return null
  // yes, compute the two centers
  var cos = Math.sqrt(1-sq(sin));   // build cos out of sin
  var d = r*cos;
  var res1 = { x : pm.x + perpABdx*d, y: pm.y + perpABdy*d };
  var res2 = { x : pm.x - perpABdx*d, y: pm.y - perpABdy*d };
  return { c1 : res1, c2 : res2} ;  
}//function findCenters

function drawCircleArc(c, r, p1, p2, side) {
  var ang1 = Math.atan2(p1.y-c.y, p1.x-c.x);
  var ang2 = Math.atan2(p2.y-c.y, p2.x-c.x);
  ctxLinks.arc(c.x, c.y, r, ang1, ang2, side);
}//function drawCircleArc


///////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper functions ////////////////////////////
///////////////////////////////////////////////////////////////////////////
function execute(callback) {
  setTimeout(function() {
    callback();
  }, 5000);
}

function execute_short(callback) {
  setTimeout(function() {
    callback();
  }, 2000);
}

function clearCanvas() {
  //Clear the canvas
  ctxLinks.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
  ctxNodes.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
}//function clearCanvas

function sq(x) { return x*x ; }

//Check if node a and b are connected
function isConnected(a, b) {
    return linkedByIndex[a + "," + b] || linkedByIndex[b + "," + a]; //|| a.index == b.index;
}

function easeOut( iteration, power ) {
  var p = power || 3;
  //returned: 0 - 1
  return 1 - Math.pow(1 - iteration, p);
}//easeOut

function uniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    })
}//uniq

//Find the device pixel ratio
function getPixelRatio(ctx) {
    //From https://www.html5rocks.com/en/tutorials/canvas/hidpi/
    let devicePixelRatio = window.devicePixelRatio || 1
    let backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1
    let ratio = devicePixelRatio / backingStoreRatio
    return ratio
}//function getPixelRatio