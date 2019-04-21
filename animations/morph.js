var screenWidth = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var canvasDim = { width: screenWidth, height: screenHeight}

var margin = {top: -20, right: 5, bottom: 5, left: 5}
var width = canvasDim.width - margin.left - margin.right 
var height = canvasDim.width - margin.top - margin.bottom 
var radius = canvasDim.width * 0.4

var nodes = []
var links = []
var gcircle, gpath, circle, path
var clicked = 1

var colorScale = d3.scaleOrdinal()
  .range(["#081EFF", "#081EFF", "#081EFF"])
  .domain(["1 step", "2 step", 'random'])

var svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var pathG = svg.append("g")
  .attr("class", "pathG")
 
var circleG = svg.append("g")
  .attr("class", "circleG")

var textG = svg.append("g")
  .attr("class", "textG")

// Initialize force simulation
var simulation1 = d3.forceSimulation()
  .force("link", d3.forceLink().id(function(d) { return d.id; }))

var simulation2 = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(function(d) {return 400}).strength(0.1))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(function(d,i) { return 16}))

function enter(nodes, links) {

  entered_circle = circleG.selectAll('circle').data(nodes)

  gcircle = entered_circle
    .enter().append('g')

  circle = gcircle
    .append('circle')
    .attr('stroke-width', 2)
    .attr('cx', function(d) {return d.fx})
    .attr('cy', function(d) {return d.fy})
    .merge(d3.selectAll('circle'))

  entered_path = pathG.selectAll('path').data(links)

  gpath = entered_path
    .enter().append('g')

  path = gpath
    .append('path')
    .attr('stroke-linecap', 'round')
    .merge(d3.selectAll('path'))

  //console.log(entered_circle, entered_path)
  //console.log(nodes, links)
}

function update() {

  circle
    .transition().duration(1000)
    .attr('r', 15)
    .attr('stroke', '#081EFF')
    .attr('fill', '#081EFF')
    .attr('cx', function(d) {return d.x})
    .attr('cy', function(d) {return d.y})
    .attr('id', function(d) {return "node-" + d.id.toString() + "-"})
    
  path
    .transition().duration(1000)
    .attr('stroke-width', '2px')
    .attr('id', function(d) { return "link" + "-source-" + d.source.id.toString() + "-target-" + d.target.id.toString() + "-" })
    .attr('stroke', function(d){ return colorScale(d.type) })
    .attr('fill', 'transparent')
    .attr("d", function(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);

      if(d.type=='2 step') {
        return "M" + 
            d.source.x + "," + 
            d.source.y + "A" + 
            dr + "," + dr + " 0 0,0 " + 
            d.target.x + "," + 
            d.target.y
      } else if (d.type=='1 step' || d.type=='random') {
        return "M" + 
            d.source.x + "," + 
            d.source.y + "L" + 
            d.target.x + "," + 
            d.target.y
      }
    })
    .attr('opacity', 1)

}

/*//////////////////////////////////////////////////////////  
//// Update force layout
///////////////////////////////////////////////////////////*/
function Graph1(){

  d3.json("./data/dummy_data.json", function(error, data) {
    if (error) throw error;

    nodes = []
    data.nodes.map(function(d,i) {
      var radian = (2 * Math.PI) / data.nodes.length * i - (Math.PI / 2);
      nodes.push({
        id: d.id,
        fx: radius * Math.cos(radian) + (width / 2),
        fy: radius * Math.sin(radian) + (height / 2),
        value: d.value
      })
    })

    links = Object.assign([], data.links) 

    enter(nodes, links)
    
    simulation1
      .nodes(nodes)
      .on("tick", update);

    simulation1.force("link")
      .links(links);

    simulation1.stop()
    for (var i = 0; i < 100; ++i) simulation1.tick()
    simulation1.alpha(1).alphaDecay(0.1).restart()

  })
  clicked=1
}

function Graph2(){

  d3.json("./data/dummy_data.json", function(error, data) {
    if (error) throw error;

    enter(data.nodes, data.links)
    
    simulation2
      .nodes(data.nodes)
      .on("tick", update);

    simulation2.force("link")
      .links(data.links);

    simulation2.stop()
    for (var i = 0; i < 100; ++i) simulation2.tick()
    simulation2.alpha(1).alphaDecay(0.1).restart()

  })

  clicked=2
}

/*//////////////////////////////////////////////////////////
//////////////// Morph!!!! ///////////////////////
//////////////////////////////////////////////////////////*/
Graph1()
d3.select("#clicker")
  .on("click", function(e) { clicked==1 ? Graph2() : Graph1()})

