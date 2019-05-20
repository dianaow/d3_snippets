///////////////////////////////////////////////////////////////////////////
///////////////////////////////// Globals /////////////////////////////////
/////////////////////////////////////////////////////////////////////////// 

const FOCI_LENGTH = 10;
const FOCI_STROKE_WIDTH = 2;
const HEIGHT = screen.width*0.45;
const INTERVAL_DURATION = 5000;
const MARGIN = 50;
const MUTATE_PROBABILITY = 0.02;
const CIRCLE_RADIUS = 4;
const WIDTH = screen.width*0.65;

var centroids, progress
let center = [WIDTH / 2, HEIGHT / 2];
let centerRadius = Math.min(WIDTH / 2, HEIGHT / 2) * 0.75;
let foci = null;
let fociCount = null;
let nodeCount = null;
let nodes = null;
let svg = null;
var chargeStrength = -5;
var fociStrength = 0.1;
var simulation = d3.forceSimulation()
var t = 0

svg = d3.select("#canvas")
    .attr("width", WIDTH + 2 * MARGIN)
    .attr("height", HEIGHT + 2 * MARGIN)
    .append("g")
    .attr("class", "margin")
    .attr("transform", `translate(${MARGIN}, ${MARGIN})`);

svg.append('rect')
  .attr("width", WIDTH)
  .attr("height", HEIGHT)  
  .attr('fill', 'none')
  .style('stroke-width', '2px')
  .style('rx', '6px') 
  .style('stroke', 'black')

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create scales ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

var money_laundering = ['#F8BBD0', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B']
var tax_customs_violation = ["#DCE775", "#D4E157", "#CDDC39", "#C0CA33", "#AFB42B", "#9E9D24", "#827717"]
var cybercrime = ['#edf8e9','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#005a32']
var organized_crime = ['#eff3ff','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#084594']
var terrorism = ['#f7f7f7','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525']
var sanctions = ['#f2f0f7','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486']
var trafficking = ['#feedde','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#8c2d04']

var colors = [{key:'Money Laundering', colors: money_laundering},
{key:'Tax & Customs Violation', colors: tax_customs_violation},
{key:'Cybercrime', colors: cybercrime},
{key:'Organised Crime', colors: organized_crime},
{key:'Terrorism', colors: terrorism}, 
{key:'Sanctions', colors: sanctions},
{key:'Trafficking in Stolen Goods', colors: trafficking}]

var focisCrime = ['Money Laundering', 'Tax & Customs Violation', 'Cybercrime', 'Organised Crime', 'Terrorism', 'Sanctions', 'Trafficking in Stolen Goods']
var focisScore = ['0-0.2', '0.2-0.4', '0.4-0.6', '0.7-0.8', '0.8-0.9', '0.9-1']
var colorScale = d3.scaleOrdinal()
  .domain(focisScore)

var focis = [{key:'crime', categories: focisCrime}, {key:'score', categories: focisScore}]

var crimeFoci = onFociCountChange(focisCrime) // create a foci for each crime category
var scoreFoci = onFociCountChange(focisScore) // create a foci for each score category

var yScale = d3.scaleBand()
  .domain(focisCrime)
  .range([HEIGHT, 50])

////////////////////// Assign focus point of each category //////////////////
function onFociCountChange(focis) {
    fociCount = focis.length
    foci = {};
    for (let i = 0; i < fociCount; i++) {
        let focus = createFocus(i, focis[i], fociCount);
        foci[i] = focus;
    }
    return foci
}

/////////////////////// Calculate focus point of each category ///////////////
function createFocus(index, key, fociCount) {
    let angle = 2 * Math.PI / fociCount * index;
    return {
        key: key,
        index: index,
        angle: angle,
        //color: d3.interpolateRainbow(index / fociCount),
        x: center[0] + centerRadius * Math.cos(angle),
        y: center[1] + centerRadius * Math.sin(angle)
    };
}

////////////////////////////////// Create nodes //////////////////////////////
function createNodes(focis, key, data) {

  var crime = focis.find(d=>d.key == 'crime').categories
  var score = focis.find(d=>d.key == 'score').categories
  var n = []

  colorScale.range(colors.find(c=>c.key == key).colors)

  data.map((d,i)=> {
    n.push({
      index: i, // unique index for each node
      id: d.id, // unique ID for each entity 
      country: d.country,
      subgraph: d.subgraph,
      crime1: d.crime1,
      binned1: d.binned1,
      focus: crime.indexOf(d.crime1), //based on first crime category
      focus2: crime.indexOf(d.crime2), //based on second crime category
      focus_score: score.indexOf(d.binned1), // based on association score category
      radius: CIRCLE_RADIUS,
      color: colorScale(d.binned1),
      strokeFill: colorScale(d.binned1),
      x: randBetween(0, WIDTH),
      y: randBetween(0, HEIGHT),   
      same_subgraph: d.same_subgraph
    })
  })
  return n
}

function createNewNodes(focis, nodes) {

  var subgraphs = nodes.map(d=>d.subgraph).filter(onlyUnique)
  var crime = focis.find(d=>d.key == 'crime').categories
  var score = focis.find(d=>d.key == 'score').categories

  var beyondWidth = [screen.width+150+Math.random(), -150+Math.random()]
  var beyondHeight = [screen.height+150+Math.random(), -150+Math.random()]
  var newNodes = []

  d3.range(0, 100).map(d=> {
    var binned1 = focisScore[getRandomArbitrary(0,score.length-1)] // randomly assigned a crime category
    var crime1 = focisCrime[getRandomArbitrary(0,crime.length-1)] // randomly assigned an association score
    colorScale.range(colors.find(c=>c.key == crime1).colors)
    newNodes.push({
      crime1: crime1,
      binned1: binned1,
      subgraph: subgraphs[getRandomArbitrary(0,subgraphs.length-1)],
      focus: crime.indexOf(crime1),
      focus_score: score.indexOf(binned1),
      radius: CIRCLE_RADIUS,
      color: colorScale(binned1),
      strokeFill: 'black',
      x: beyondWidth[getRandomArbitrary(0,1)],
      y: beyondHeight[getRandomArbitrary(0,1)],
      class: 'new',
    })
  })

  nodes.push(newNodes)
  nodes = [].concat.apply([], nodes)
  nodes.forEach((d,i)=>{
    d.index = i
  })

  return nodes
}

///////////////////////// Update focus point of some nodes //////////////////////
function changeNodeFoci(nodes, focis) {

  nodes.map((d,i) => {
    if (d.focus2) {
      let point = d;
      let newFocus = d.focus2; // change focus point 
      point.focus = newFocus;
    }
  })

  updateCircleColor()
  simulate_add(nodes, focis)

}

/////////////////////// Update foci based on industry categories //////////////////
function changeFocitoIndustry(nodes, focis) {

  nodes.map((d,i) => {
    if (d.focus_score!=-1) {
      let point = d;
      let newFocus = d.focus_score; // change focus point 
      point.focus = newFocus;
    } 
  })
  updateLabels(scoreFoci, 'groupIndustry')
  simulate_add(nodes, focis)

}

/////////////////////// Update foci based on score categories //////////////////
function changeFocitoScore(data) {

  svg.selectAll('text').remove()
  var pointsBar = createDots(data, 'bar')
  var pointsBar1 = createDots(data, 'tiledbar')
  updateCircles(pointsBar, 'groupScore')
  setTimeout(function(){
    updateCircles(pointsBar1, 'groupScore')
  }, 3000)
  var ASFocis = []
  focisScore.map((d,i)=>{
    ASFocis.push({
      key : d,
      x : ((i*150)+100),
      y : HEIGHT-100
    })
  })
  updateLabels(ASFocis, 'groupScore')

}

function createDots(data, type) {

  var arrays 
  var nodeRadius = CIRCLE_RADIUS * 2
  var tilesPerRow = 8
  var tileSize = nodeRadius * 1.5
  var barWidth = 150
  var leftBuffer = 50
  var bottomBuffer = 50

  data.sort(function(x, y){
     return d3.descending(x.color, y.color);
  })

  if(type=='bar'){
    barChart()
  } else if(type=='tiledbar'){
    tiledbarChart()
  }

  function barChart() {

    arrays = []
    var res_nested_bin = d3.nest()
      .key(d=>d.binned1)
      .sortKeys(function(a,b) { return focisScore.indexOf(a) - focisScore.indexOf(b); })
      .entries(data)

    res_nested_bin.map((d,i) => {
      arrays.push(getTilesBar(d.key, d.values, i)) // get x-y coordinates of all tiles first without rendering the dotted bar chart
    })
    console.log(arrays)
  }

  function tiledbarChart() {

    arrays = []
    var res_nested_bc = d3.nest()
      .key(d=>d.binned1)
      .key(d=>d.crime1)
      .sortKeys(function(a,b) { return focisScore.indexOf(a) - focisScore.indexOf(b); })
      .entries(data)

    res_nested_bc.map((d1,i1) => {
      d1.values.map((d2,i2) => {
        arrays.push(getTilesBarTiled(d2.key, d2.values, i1))
      })
    })
    console.log(arrays)
  }

  var distributed = [].concat.apply([], arrays)
  return distributed

  function getTilesBar(key, values, counter) {

    var tiles = []
    for(var i = 0; i < values.length; i++) {
      var rowNumber = Math.floor(i / tilesPerRow)
      tiles.push({
        x: ((i % tilesPerRow) * tileSize) + (counter * barWidth) + tileSize + leftBuffer,
        y: -(rowNumber + 1) * tileSize + HEIGHT - bottomBuffer, // stack nodes within same group
        crime: values[i].focus,
        color: values[i].color,
        index: values[i].index, // index each node
        radius: (tileSize/1.5)/2
      });
    }
    return tiles

  }

  function getTilesBarTiled(key, values, counter) {

    var tiles = []
    for(var i = 0; i < values.length; i++) {
      var rowNumber = Math.floor(i / tilesPerRow)
      tiles.push({
        x: ((i % tilesPerRow) * tileSize) + (counter * barWidth) + tileSize + leftBuffer,
        y: -(rowNumber + 1) * tileSize + yScale(values[i].crime1),
        crime: values[i].focus,
        color: values[i].color,
        index: values[i].index, // index each node
        radius: (tileSize/1.5)/2
      });
    }
    return tiles

  }

}


////////////////////////////////// INITIALIZE ///////////////////////////////
 function init() {
  d3.csv("./data/scores_new.csv", function(data) {
    var res = data.map((d,i) => {
      return {
        id: d.id,
        subgraph: d.subgraph,
        country: d.country,
        score1: +d.score1,
        crime1: d.crime1,
        binned1 : d.binned1,
        score2: +d.score2,
        crime2: d.crime2,
        binned2 : d.binned2,
        same_subgraph: d.same_subgraph
      }
    })

    var res_nested_crime = d3.nest()
      .key(d=>d.crime1)
      .entries(res)

    nodes = []
    res_nested_crime.map(d=> {
      var n = createNodes(focis, d.key, d.values)
      nodes.push(n)
    })
    nodes = [].concat.apply([], nodes)
    
    nodes = createNewNodes(focis, nodes) // create a new set of nodes to 'fly in'
 
    updateCircles(nodes, 'groupCrime') // render nodes
    updateLabels(crimeFoci, 'groupCrime')

    simulate(nodes, crimeFoci) // kick off simulation

    setTimeout(function(){simulate_add(nodes, crimeFoci)}, 1500)
    setTimeout(function(){changeNodeFoci(nodes, crimeFoci)}, 3000)

    d3.select('.changeFocitoCrime').on("click", function () { 
      init()
      setTimeout(function(){simulate_add(nodes, crimeFoci)}, 500)
      setTimeout(function(){changeNodeFoci(nodes, crimeFoci)}, 2500)
    });
    d3.select('.changeFocitoIndustry').on("click", function () { changeFocitoIndustry(nodes, scoreFoci) });
    d3.select('.changeFocitoScore').on("click", function () { changeFocitoScore(nodes) });
    d3.select('.changeFocitoSubgraph').on("click", function () { simulate_group(nodes) });
    d3.select('.changeFocitoCountry').on("click", function () { drawMap(nodes) });

    //setTimeout(function(){simulate_add(nodes, crimeFoci)}, 2500)
    //setTimeout(function(){changeNodeFoci(nodes, crimeFoci)}, 5000)
    //setTimeout(function(){changeFocitoAS(nodes, scoreFoci)}, 7500)
    //setTimeout(function(){simulate_group(nodes)}, 10000)
    //setTimeout(function(){changeNodeGroup(nodes)},13000)
    //setTimeout(function(){drawMap(nodes)}, 15000)

  })
}

init()


////////////////////////////////// Simulate nodes //////////////////////////////
function simulate(nodes, foci) {

  nodes.forEach(d=>{
    d.x1 = d.class=='new' ? d.x : foci[d.focus].x
    d.y1 = d.class=='new' ? d.y : foci[d.focus].y
  })

  startSimulation()

}

///////////////////////// Add nodes (with simulation) /////////////////////////
/////////////////// Move nodes to new foci (with simulation) //////////////////
function simulate_add(nodes, foci) {

  nodes.forEach(d=>{
    d.x1 = foci[d.focus].x
    d.y1 = foci[d.focus].y
  })
  
  startSimulation()

}

///////////////////////// Pool all nodes (with simulation) /////////////////////////
function simulate_pool(nodes) {

  svg.selectAll('text').remove()

  nodes.forEach(d=>{
    d.x1 = WIDTH/2
    d.y1 = HEIGHT/2
  })

  startSimulation()

}

/////////////// Group nodes according to subgraphs (with simulation) ///////////////
function simulate_group(nodes) {

  svg.selectAll('text').remove()

  nodes.forEach(d=>{
    d.x1 = WIDTH/2
    d.y1 = HEIGHT/2
  })
  var NUM_FLICKS = d3.max(nodes, d=>d.same_subgraph)

  simulation.nodes(nodes)
  simulation.force("charge", d3.forceManyBody().strength(-40))
  simulation.force("cluster").strength(0.5)
  simulation.velocityDecay(0.3).alpha(0.5).restart()

  setTimeout(function() { changeNodeGroup(NUM_FLICKS) }, 1000)

  // show progress bar to indicate time to end of animation
  var segmentWidth = WIDTH-40
  progress = svg.append('rect')
    .attr('class', 'bg-rect')
    .attr('rx', 10)
    .attr('ry', 10)
    .attr('fill', 'lightgray')
    .attr('height', 5)
    .attr('width', 0)
    .attr('x', 20)
    .attr('y', 10)

  function moveProgressBar(t, NUM_FLICKS){
    progress.transition()
      .duration(800)
      .attr('fill', 'black')
      .attr('width', function(){
        return t/NUM_FLICKS * segmentWidth;
      });
  }    

  function changeNodeGroup(NUM_FLICKS) {

    var animation_interval = d3.interval(function(){

      t += 1  // update time

      if (t > NUM_FLICKS) { animation_interval.stop(); simulation.stop(); return true } // stop simulation after 10 timesteps

      assignOtherSubgraph(t)
      moveProgressBar(t, NUM_FLICKS)

    }, 800, d3.now() - 800)

    function assignOtherSubgraph(t) {

      if (nodes.find(d=>d.same_subgraph == t)) {
        var nodeID = nodes.find(d=>d.same_subgraph == t).index // locate the ID of the node to move (this requires a column indexing repeated nodes in consecutive manner)
        var other_subgraph = nodes.filter(d=>d.id==nodeID).map(d=>d.subgraph)
        var current_subgraph = nodes[nodeID].subgraph  
        var new_subgraph = current_subgraph == other_subgraph[0] ? other_subgraph[1] : other_subgraph[0] // find the other subgraph the node belongs to
        nodes[nodeID].subgraph = new_subgraph // assign new subgraph

        simulation.nodes(nodes)
        simulation.velocityDecay(0.4).alpha(0.5).restart()
      }

    }

  }

}

//////////////////// Reinitialize simulation ////////////////////
function startSimulation() {

  simulation.nodes(nodes)
    .force("charge", d3.forceManyBody().strength(chargeStrength).distanceMin(CIRCLE_RADIUS))
    .force("collide", d3.forceCollide(CIRCLE_RADIUS + 2))
    .force("cluster", forceCluster())
    .force("position-x", d3.forceX(d=>d.x1).strength(fociStrength))
    .force('position-y', d3.forceY(d=>d.y1).strength(fociStrength))
    .on("tick", onSimulationTick)

  simulation.force("cluster").strength(0)
  simulation.velocityDecay(0.3).alpha(0.5).restart()

}

function onSimulationTick() {
  svg.selectAll("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
}

////////////////////////////////// Update nodes //////////////////////////////

function updateCircles(data, type) {

    let circles = svg.selectAll("circle").data(data, d=>d.index);

    circles.exit().remove()

    // Add new circles to the graph.
    var entered_circles = circles
        .enter()
        .append("circle")
        .classed("node", true)
        .classed("enter", true)
        .attr("id", d => d.index)
        .attr("r", d => d.radius)
        .attr("fill", d => d.color)
        .attr('stroke', d=>d.strokeFill)
        .attr('stroke-width', '1px')
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)

    circles = circles.merge(entered_circles)

  if(type=='groupCrime'){

    circles
      .classed("enter", false)
      .classed("update", true)
      .attr("fill", d => d.color)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)  

  } else if(type=='groupScore'){

    simulation.stop()

    var t = d3.transition()
      .duration(2000)
      .ease(d3.easeQuadOut)

    circles
      .classed("enter", false)
      .classed("update", true)

    circles.transition(t)
      .attr("fill", d => d.color)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)  

  }

}

function updateCircleColor() {
    svg.selectAll("circle")
      .transition().delay(10).duration(500)
       .attr("fill", d => d.color)
}

////////////////////////////////// Update labels //////////////////////////////
function updateLabels(data, type) {
    
    if(type=='groupCrime' || type=='groupIndustry') {
      var data_new = []
      Object.keys(data).map(function(key, index) {
         data_new.push({
          x: data[index].x,
          y: data[index].y,
          key: data[index].key
        })     
      })
      var texts = svg.selectAll("text").data(data_new)
    } else {
      var texts = svg.selectAll("text").data(data)
    }

    // For existing circles, remove the "enter" class and
    // add the "update" class.
    texts.classed("enter", false)
        .classed("update", true)

    // Add new circles to the graph.
    texts.enter()
        .append("text")
        .classed("node", true)
        .classed("enter", true)
        .attr("fill", d => 'black')
        .attr("x", d => d.x-40)
        .attr("y", d => d.y+80)
        .text(d=>d.key)
        .merge(texts)
        .attr("x", d => d.x-40)
        .attr("y", d => d.y+80)
        .text(d=>d.key)

    texts.exit().remove(); 
}

/////////////////////////////// Render map ////////////////////////////////
// Define map projection
var projection = d3
   .geoEquirectangular()
   .center([0, 0]) // set centre to further North
   .scale([WIDTH/5]) // scale to fit group width
   .translate([WIDTH/2,HEIGHT/2]) // ensure centred in group

// Define map path
var path = d3.geoPath()
   .projection(projection)

var countriesGroup = svg
 .append("g")
 .attr("id", "map")

function drawMap(data) {
  // get map data
  d3.json("https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json",
    function(error, json) {

      simulate_pool(data)

      // draw a path for each feature/country
      countriesPaths = countriesGroup
         .selectAll("path")
         .data(json.features)
         .enter()
         .append("path")
         .attr("d", path)
         .attr("id", function(d, i) { return "country" + d.properties.name })
         .attr("class", "country")

      // store an array of country centroids
      var countryFoci = []
      json.features.map(d=> {
        countryFoci.push({
          'country': d.properties.name,
          'x': path.centroid(d)[0],
          'y': path.centroid(d)[1]
        })
      })

      data.map(d=>{
        var country = countryFoci.find(c=>c.country == d.country)
        if(country){
          d.x1 = country.x
          d.y1 = country.y
        } 
      })

      simulation.nodes(data)
        .force("position-x", d3.forceX(d=>d.x1).strength(fociStrength))
        .force('position-y', d3.forceY(d=>d.y1).strength(fociStrength))
        .on("tick", onSimulationTick)

      simulation.velocityDecay(0.3).alpha(0.8).restart()

      // append country labels only for selected countries
      var selCountries = data.map(d=>d.country).filter(onlyUnique)
      countryLabels = countriesGroup
         .selectAll("g")
         .data(json.features.filter(d=>selCountries.indexOf(d.properties.name) != -1))
         .enter()
         .append("g")
         .attr("id", function(d) { return "countryLabel-" + d.properties.name })
         .attr("transform", function(d) {
            return (
               "translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + 20 + ")" // centroid of countries
            );
         })
         .append("text")
         .attr('font-size', '11px')
         .attr("text-anchor", 'middle')
         .attr('dy', '0.35em')
         .text(function(d) { return d.properties.name })
   }
  )
}

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper functions ////////////////////////////
///////////////////////////////////////////////////////////////////////////

function forceCluster() {
  var strength = 0.5;
  let nodes;

  function force(alpha) {
    centroids = d3.rollup(nodes, centroid, d => d.subgraph);

    const l = alpha * strength;
    for (const d of nodes) {
      const {x: cx, y: cy} = centroids.get(d.subgraph);
      d.vx -= (d.x - cx) * l;
      d.vy -= (d.y - cy) * l;
    }
  }

  force.initialize = _ => nodes = _;
  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };
  return force;
}

function centroid(nodes) {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const d of nodes) {
    let k = d.radius ** 2;
    x += d.x * k;
    y += d.y * k;
    z += k;
  }
  return {x: x / z, y: y / z};
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function randBetween(min, max) {
    return min + (max - min) * Math.random();
}

function getRandomArbitrary(min, max) {
  return Math.round(Math.random() * (max - min) + min)
}
