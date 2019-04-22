var simulation, simulation1, voronoi_data, clusterData
var screenWidth = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var canvasDim = { width: screenWidth, height: screenHeight}

var margin = {top: 5, right: 5, bottom: 5, left: 5}
var width = canvasDim.width - margin.left - margin.right 
var height = canvasDim.width - margin.top - margin.bottom 

var svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)

let gEnter = svg
    .append("g")
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr('class', 'chartG')

var random, circles
var networkData = []

var colorScale = d3.scaleOrdinal()
  .domain(["1", "2", "3", "4", "5", "6", "7", "8"])
  .range(['#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000'])

var dummyData = []
d3.range(1,4).map((d,i) => {
  dummyData.push({"outcome": 1, 'color': 'red', 'radius': 10})
})
d3.range(1,300).map((d,i) => {
  dummyData.push({"outcome": 0, 'color': colorScale(getRandomArbitrary(1, 8).toString()), 'radius': 4})
})

random = dummyData.map(function (d, i) {
  return {
      id: i,
      x: +Math.random() / 3.4,
      y: +Math.random(),
      color: d.color,
      radius: d.radius
  }
})

function getRandomArbitrary(min, max) {
  return Math.round(Math.random() * (max - min) + min)
}


let xMax = d3.max(random, d=> +d.x) * 1.1
let xMin = d3.min(random, d=> + d.x) - xMax/15
let yMax = d3.max(random, d=> +d.y) * 1.1
let yMin = d3.min(random, d=> + d.y) - yMax/15

var xScale = d3.scaleLinear()
  .range([0, width])
  .domain([xMin, xMax])

var yScale = d3.scaleLinear()
  .range([height/4, height*(3/4)])
  .domain([yMin, yMax])


function scatter() {
  
  random.forEach(d=>{
    d.x = xScale(d.x),
    d.y = yScale(d.y)
  })
  
  simulation1 = d3.forceSimulation(random)
    .force("x", d3.forceX(function (d) { return d.x }))
    .force("y", d3.forceY(function (d) { return d.y }))
    .force("collide", d3.forceCollide(function(d,i) { return d.radius + 5}))
    .stop();

  for (var i = 0; i < 200; ++i) simulation1.tick()

  var voronoi_data = d3.voronoi()
    .extent([[0, 0], [width, height]])
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .polygons(random)

  console.log(voronoi_data)
  enterCirclesVoronoi(voronoi_data)
  
}

function cluster() {

  var xScaleOrd = d3.scaleBand()
  .range([width/3, width])
  .domain([0, 1])

  clusterData = dummyData.map(function (d, i) {
    return {
        id: i,
        x: xScaleOrd(d.outcome),
        y: height/2,
        color: d.color,
        radius: d.radius
    }
  })

  //simulation1.stop()

  simulation = d3.forceSimulation(clusterData)
    .force("x", d3.forceX(function (d) { return d.x }))
    .force("y", d3.forceY(function (d) { return d.y }))
    .force("collide", d3.forceCollide(function(d,i) {return d.radius + 5}))
    .stop();

  for (var i = 0; i < 150; ++i) simulation.tick()

  voronoi_data = d3.voronoi()
    .extent([[0, 0], [width, height]])
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .polygons(clusterData)

  enterCirclesVoronoi(voronoi_data)
  updateCirclesVoronoi()
}

function inject() {

  simulation.stop()

  simulation
    .force('charge', d3.forceManyBody().strength(-5))
    .force("x", d3.forceX(function(d) { return d.outcome === 1 ? 0 : width }) )
    .force("y", d3.forceY(function (d) { return d.y }))
    .stop();

  for (var i = 0; i < 500; ++i) simulation.tick()

  voronoi_data = d3.voronoi()
    .extent([[0, 0], [width, height]])
    .x(function(d) { return d.x })
    .y(function(d) { return d.y; })
    .polygons(clusterData)

  enterCirclesVoronoi(voronoi_data)
  updateCirclesVoronoi()

}

function enterCirclesVoronoi(data) {

  circles = svg
      .select('.chartG')
      .selectAll('circle')
      .data(data)

  entered_circles = circles
      .enter()
      .append('circle')
        .attr('cx', function(d) { return d.data.x })
        .attr('cy', function(d) { return d.data.y })
        .style('opacity', 1)
        .style('fill', function (d) { return d.data.color })
        .attr('r', function (d) { return d.data.radius })

  paths = svg
      .select('.chartG')
      .selectAll('path')
      .data(data)

  entered_paths = paths
      .enter()
      .append("path")
        .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
        .style('stroke', 'none')
        .style('stroke-width', '1px')
        .style('fill', 'none')

}

function updateCirclesVoronoi() {

  circles = circles.merge(entered_circles)

  circles
    .transition()
    .duration(1500)
    .delay(700)
    .attr('cx', (d) => d.data.x)
    .attr('cy', (d) => d.data.y)
 
  paths = paths.merge(entered_paths)

  paths
    .transition()
    .duration(1500)
    .delay(700)
    .attr("d", function(d) { return "M" + d.join("L") + "Z"; })


}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function execute(callback) {
  setTimeout(function() {
    callback();
  }, 3000);
}

execute(function() {
  scatter()
 execute(function() {
  cluster()
   //execute(function() {
    //inject()
   //});
 });
});
    