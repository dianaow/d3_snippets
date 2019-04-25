///////////////////////////////////////////////////////////////////////////
///////////////////////////////// Globals /////////////////////////////////
/////////////////////////////////////////////////////////////////////////// 
var simulation, circles
var margin = {
  top: 50,
  right: 10,
  bottom: 10,
  left: 50
};
var totalWidth = 1800;
var totalHeight = 900;
var width = totalWidth - margin.left - margin.right;
var height = totalHeight - margin.top - margin.bottom;
var crime = ["Money Laundering", "Credit card fraud", "Sanctioned transaction", "Ponzi schemes", "Terrorist financing"]

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

// link random distribution to color scale

var radiusScale = d3.scaleLinear()
.domain(d3.range(1,5))
.range(d3.range(3, 15, 3))

var xScale = d3.scaleLinear()
  .range([0, width])
  
var yScale = d3.scaleLinear()
  .range([100, height])
  
var buffer = 500
var xScaleDist = d3.scaleBand()
  .range([0, width])
  .domain(["1", "2", "3", "4", "5", "6", "7", "8", "9"])

var yScaleCount = d3.scaleLinear()
  .range([height, height*(3/4)])


///////////////////////////////////////////////////////////////////////////
////////////////////////// Initialize the force ///////////////////////////
///////////////////////////////////////////////////////////////////////////

getSimulationData();


function getSimulationData() {

  execute1000(function() {
    scatter(); // kick off simulation
    //cycleCaptions(0)
    execute(function() {
      cluster()
      //cycleCaptions(1)
      execute(function() {
      inject()
      //cycleCaptions(2)
        //cycleCaptions(3)
        execute(function() {
          infect()
          execute(function() {
            migrate()
          })
          //cycleCaptions(4)
        })
     });
   });
  });
      
} 

///////////////////////////////////////////////////////////////////////////
/////////////////////// Modify simulation params //////////////////////////
///////////////////////////////////////////////////////////////////////////

function scatter() {

  var dummyData = []
  d3.range(1,4).map((d,i) => {
    dummyData.push({"outcome": 1, 'color': 'red', 'radius': 22, 'label':i})
  })
  d3.range(1,300).map((d,i) => {
    dummyData.push({"outcome": 0, 'color': colorScale(getRandomArbitrary(1, 8).toString()), 'radius': radiusScale(getRandomArbitrary(1, 8)), 'label': crime[getRandomArbitrary(0, 5)]})
  })

  nodes = dummyData.map(function (d, i) {
    return {
        id: i,
        outcome: d.outcome,
        x: +Math.random(),
        y: +Math.random(),
        color: d.color,
        radius: d.radius,
        label: d.label
    }
  })

  let xMax = d3.max(nodes, d=> +d.x) * 1.1
  let xMin = d3.min(nodes, d=> + d.x) - xMax/15
  let yMax = d3.max(nodes, d=> +d.y) * 1.1
  let yMin = d3.min(nodes, d=> + d.y) - yMax/15

  xScale.domain([xMin, xMax])
  yScale.domain([yMin, yMax])

  // change some nodes to red color
  // ensure a node from each category changes
  var nodesToRed = [10, 20, 30, 40, 50, 60, 70, 80, 90, 110, 120, 130, 140, 150, 160, 170, 180]
  // hide all nodes except for three random nodes
  var nodesToHighlight = [100, 200, 300]
  nodes.forEach(d=>{
    d.infect = (nodesToRed.indexOf(d.id)!=-1 && d.radius > 18) ? 1 : 0,
    d.fadeOut = nodesToHighlight.indexOf(d.id) == -1 ? true : false,
    d.x = xScale(d.x),
    d.y = yScale(d.y)
  })

  circles = g.selectAll('circle').data(nodes)

  var entered_circles = circles
      .enter()
      .append('circle')
        .attr('class', d=> 'infected-' + d.infect)
        .attr('id', d=> 'fadeOut-' + d.fadeOut)
        .style('opacity', 1)
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)

  circles = circles.merge(entered_circles)

  circles.transition()
    .duration(1500)
    .attr('cx', (d) => d.x)
    .attr('cy', (d) => d.y)
    .style('fill', function (d) { return d.color })
    .attr('r', function (d) { return d.radius })
  
  simulation = d3.forceSimulation(nodes)
    .alpha(.02)
    .force('charge', d3.forceManyBody().strength(-30))
      .force("x", d3.forceX(function (d) { return d.x }))
      .force("y", d3.forceY(function (d) { return d.y }))
      .force("collide", d3.forceCollide(function(d,i) { return d.radius + 5}))

  simulation.on('tick', ticked);

  function ticked() {
    circles
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
  }

} 

function cluster() {

  simulation.stop();

  simulation
    .force('charge', d3.forceManyBody().strength(-30))
    .force('x', d3.forceX(function(d) { return d.outcome === 0 ? width * 0.35 : width * 0.85; }) )
    .force('y', d3.forceY(height/2))
    .force("collide", d3.forceCollide(function(d,i) { return d.radius + 5}))
    
  simulation.alpha(0.5);

  simulation.restart();

}

function inject() {

  simulation.stop();

  simulation
    .force('charge', d3.forceManyBody().strength(-30))
    // to weaken pull towards fixed width and create a nice aesthetic circle
    // leave it at default strength and ensure forceX is not simply 'width/2'
    .force('x', d3.forceX(function(d) { return d.outcome === 0 ? width * 0.5 : width * 0.3; })) 
    .force('y', d3.forceY(height/2))
    .force("collide", d3.forceCollide(function(d,i) { return d.radius + 5}))
    
  simulation.alpha(0.5);

  simulation.restart();

}

function infect() {

  d3.selectAll('.infected-1')
    .transition().ease(d3.easeLinear).duration(1500)
    .style("fill", 'red') 

}

function migrate() {

  d3.selectAll('#fadeOut-true')
    .transition().ease(d3.easeLinear).duration(1500)
    .style('opacity', 0)

  var nodesToHighlight = [100, 200, 300]
  var nodesThree = nodes.filter(d=>(nodesToHighlight.indexOf(d.id) != -1))
  console.log(nodesThree)
  gCircle1 = g.selectAll('.threeleft').data(nodesThree)

  var entered_circles = gCircle1
    .enter().append('circle')
      .attr('class', "threeleft")
      .attr("fill", d=> d.color) 
      .attr("fill-opacity", 1)
      .attr('r', d=>d.radius)
      .attr("cx", d=> d.x)
      .attr("cy", d=> d.y)
      
  gCircle1 = gCircle1.merge(entered_circles)

  d3.selectAll('#fadeOut-false')
  .transition().ease(d3.easeLinear).duration(500)
  .style('opacity', 0)

  setTimeout(function(d) {

    gText = g.selectAll('text').data(nodesThree)

    entered_text = gText
      .enter().append('text')
        .attr("font-family", "Helvetica")
        .attr("font-size", "18px")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("fill-opacity", 0)
        .attr("x", d=>d.x)
        .attr("y", d=>d.y)


    simulation.nodes(nodesThree)
      .alphaDecay(.005)
      .velocityDecay(0.2)
      .force('charge', d3.forceManyBody().strength(-30))
      .force("collide", d3.forceCollide(function(d,i) { return d.radius + 50}))
      .force('x', d3.forceX(function(d) { return width/2 }))
      .force('y', d3.forceY(function(d) { return height/2 }))
      .on('tick', toMigrate)

    simulation.alpha(0.1);

    simulation.restart();

    function toMigrate() {

      gCircle1
        .attr("cx", d=> d.x)
        .attr("cy", d=> d.y)
    }

  }, 2000)

  var labels = ['Shareholder X', 'Company A', 'Company B']

  setTimeout(function() {

    gCircle1
        .transition().ease(d3.easeLinear).duration(1000)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr('stroke-width', "4px")

    entered_text
        .merge(gText)
        .transition().ease(d3.easeLinear).duration(1000)
        .text((d,i)=> labels[i])
        .attr("x", d=>d.x)
        .attr("y", d=>d.y-30)
        .attr("fill-opacity", 1)

    gText.exit().remove()

   }, 3500)
}


///////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper functions ////////////////////////////
///////////////////////////////////////////////////////////////////////////
function randn_bm(min, max, skew) {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = randn_bm(min, max, skew); // resample between 0 and 1 if out of range
    num = Math.pow(num, skew); // Skew
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    return num;
}

function getRandomArbitrary(min, max) {
  return Math.round(Math.random() * (max - min) + min)
}

function execute(callback) {
  setTimeout(function() {
    callback();
  }, 5000);
}

function execute1000(callback) {
  setTimeout(function() {
    callback();
  }, 2000);
}

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
    