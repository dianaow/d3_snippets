///////////////////////////////////////////////////////////////////////////
///////////////////////////////// Globals /////////////////////////////////
/////////////////////////////////////////////////////////////////////////// 
var simulation, circles
var margin = {
  top: 50,
  right: 10,
  bottom: 10,
  left: 10
};
var totalWidth = 1250;
var totalHeight = 1200;
var width = totalWidth - margin.left - margin.right;
var height = totalHeight - margin.top - margin.bottom;

var screenWidth = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var canvasDim = { width: screenWidth, height: screenHeight}

///////////////////////////////////////////////////////////////////////////
//////////////////// Set up and initiate containers ///////////////////////
/////////////////////////////////////////////////////////////////////////// 

var svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)

var g = svg
    .append("g")
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create scales ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

var colorScale = d3.scaleOrdinal()
  .domain(["1", "2", "3", "4", "5", "6", "7", "8"])
  .range(['#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000'])

var radiusScale = d3.scaleLinear()
.domain(d3.range(1,6))
.range(d3.range(3, 18, 3))

var xScale = d3.scaleLinear()
  .range([0, width])
  
var yScale = d3.scaleLinear()
  .range([0, height])

///////////////////////////////////////////////////////////////////////////
////////////////////////// Initialize the force ///////////////////////////
///////////////////////////////////////////////////////////////////////////

getSimulationData();

///////////////////////////////////////////////////////////////////////////
////////////////////////////// Data processing ////////////////////////////
///////////////////////////////////////////////////////////////////////////

function getSimulationData() {

  var dummyData = []
  d3.range(1,4).map((d,i) => {
    dummyData.push({"outcome": 1, 'color': 'red', 'radius': 22})
  })
  d3.range(1,200).map((d,i) => {
    dummyData.push({"outcome": 0, 'color': colorScale(getRandomArbitrary(1, 8).toString()), 'radius': radiusScale(getRandomArbitrary(1, 8))})
  })

  nodes = dummyData.map(function (d, i) {
    return {
        id: i,
        outcome: d.outcome,
        x: +Math.random(),
        y: +Math.random(),
        color: d.color,
        radius: d.radius
    }
  })

  let xMax = d3.max(nodes, d=> +d.x) * 1.1
  let xMin = d3.min(nodes, d=> + d.x) - xMax/15
  let yMax = d3.max(nodes, d=> +d.y) * 1.1
  let yMin = d3.min(nodes, d=> + d.y) - yMax/15

  xScale.domain([xMin, xMax])
  yScale.domain([yMin, yMax])

  nodes.forEach(d=>{
    d.x = xScale(d.x),
    d.y = yScale(d.y)
  })

  nodes = d3.voronoi()
    .extent([[0, 0], [width, height]])
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .polygons(nodes)

  circles = g.selectAll('circle').data(nodes)

  var entered_circles = circles
      .enter()
      .append('circle')
        .style('opacity', 1)
        .attr('cx', (d) => d.data.x)
        .attr('cy', (d) => d.data.y)

  circles = circles.merge(entered_circles)

  circles.transition()
    .duration(1500)
    .attr('cx', (d) => d.data.x)
    .attr('cy', (d) => d.data.y)
    .style('fill', function (d) { return d.data.color })
    .attr('r', function (d) { return d.data.radius })

  execute(function() {
   scatter(); // kick off simulation
   execute(function() {
    cluster()
     execute(function() {
      inject()
     });
   });
  });
      
} 


///////////////////////////////////////////////////////////////////////////
/////////////////////// Modify simulation params //////////////////////////
///////////////////////////////////////////////////////////////////////////

function scatter() {

  simulation = d3.forceSimulation(nodes)
    .alpha(.02)
    .force('charge', d3.forceManyBody().strength(-30))
      .force("x", d3.forceX(function (d) { return d.data.x }))
      .force("y", d3.forceY(function (d) { return d.data.y }))
      .force("collide", d3.forceCollide(function(d,i) { return d.data.radius + 5}))
      .stop();

  simulation.on('tick', ticked);

  function ticked() {

    circles
      .attr('cx', (d) => d.data.x)
      .attr('cy', (d) => d.data.y)

  }

}

function cluster() {

  simulation.stop();

  simulation
    .force('charge', d3.forceManyBody().strength(-30))
    .force('x', d3.forceX(function(d) { return d.data.outcome === 0 ? width * 0.35 : width * 0.95; }) )
    .force('y', d3.forceY(height/2))
    .force("collide", d3.forceCollide(function(d,i) { return d.data.radius + 5}))
    
  simulation.alpha(0.5);

  simulation.restart();

}

function inject() {

  simulation.stop();

  simulation
    .force('charge', d3.forceManyBody().strength(-30))
    // to weaken pull towards fixed width and create a nice aesthetic circle
    // leave it at default strength and ensure forceX is not simply 'width/2'
    .force('x', d3.forceX(function(d) { return d.data.outcome === 0 ? width * 0.5 : width * 0.2; })) 
    .force('y', d3.forceY(height/2))
    .force("collide", d3.forceCollide(function(d,i) { return d.data.radius + 5}))
    
  simulation.alpha(0.5);

  simulation.restart();

}

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper functions ////////////////////////////
///////////////////////////////////////////////////////////////////////////

function getRandomArbitrary(min, max) {
  return Math.round(Math.random() * (max - min) + min)
}

function execute(callback) {
  setTimeout(function() {
    callback();
  }, 3000);
}

    