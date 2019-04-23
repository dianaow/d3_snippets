///////////////////////////////////////////////////////////////////////////
///////////////////////////////// Globals /////////////////////////////////
/////////////////////////////////////////////////////////////////////////// 
var simulation, countsExtended
var margin = {
  top: 50,
  right: 10,
  bottom: 0,
  left: 50
};
var totalWidth = 1800;
var totalHeight = 900;
var width = totalWidth - margin.left - margin.right;
var height = totalHeight - margin.top - margin.bottom;

var crime = ["Money Laundering", "Sanctioned transaction", "Terrorist financing"]

///////////////////////////////////////////////////////////////////////////
//////////////////// Set up and initiate containers ///////////////////////
/////////////////////////////////////////////////////////////////////////// 

var canvas = d3.select('#chart').append('canvas')

var context = canvas.node().getContext('2d');

var sf = Math.min(2, getPixelRatio(context)) //no more than 2
if(screen.width < 500) sf = 1 //for small devices, 1 is enough

canvas
  .attr('width', sf * totalWidth)
  .attr('height', sf * totalHeight)
  .style('width', totalWidth + "px")
  .style('height', totalHeight + "px")

context.scale(sf,sf)
context.translate(margin.left, margin.top);

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Create scales ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

var colorScale = d3.scaleOrdinal()
  .domain(["1", "2", "3", "4", "5", "6", "7", "8"])
  .range(['#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000'])

// link random distribution to color scale

var radiusScale = d3.scaleLinear()
.domain(d3.range(1,6))
.range(d3.range(3, 18, 3))

var xScale = d3.scaleLinear()
  .range([0, width])
  
var yScale = d3.scaleLinear()
  .range([0, height])
  
var xScaleDist = d3.scaleBand()
  .range([margin.left+100, width])
  .domain(["1", "2", "3", "4", "5", "6", "7", "8", "9"])

var yScaleCount = d3.scaleLinear()
	.range([height, height*(3/4)])
	
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
    dummyData.push({"outcome": 1, 'color': 'red', 'radius': 22, 'label':crime[i], 'band': "9"})
  })
  d3.range(1,300).map((d,i) => {
  	var rand = getRandomArbitrary(1, 8).toString()
    dummyData.push({"outcome": 0, 'color': colorScale(rand), 'band': rand, 'radius': radiusScale(getRandomArbitrary(1, 8)), 'label': crime[getRandomArbitrary(0, 3)]})
  })

  nodes = dummyData.map(function (d, i) {
    return {
        id: i,
        outcome: d.outcome,
        x: +Math.random(),
        y: +Math.random(),
        color: d.color,
        radius: d.radius,
        label: d.label ? d.label : "Money Laundering",
        band : d.band
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

	execute(function() {
	 scatter(nodes); // kick off simulation
	 execute(function() {
	  cluster()
	   	execute(function() {
	    inject()
	  	execute(function() {
	  		shiftTop()
		    execute1000(function() {
		      distribute()
		    })
		  })
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
	    .force("x", d3.forceX(function (d) { return d.x }))
	    .force("y", d3.forceY(function (d) { return d.y }))
	    .force("collide", d3.forceCollide(function(d,i) { return d.radius + 5}))
	 	
	simulation.on('tick', ticked);

	function ticked() {

		context.clearRect(-margin.left, -margin.top, totalWidth, totalHeight);
		context.save();

		nodes.forEach(drawNode);

		context.restore()

	}

	function drawNode(d) {

		context.globalAlpha = d.hide ? 0 : 1;
		context.beginPath();
		context.moveTo(d.x + d.radius, d.y);
		context.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
		context.fillStyle = d.color;
		context.fill();
		
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

	nodes.forEach(d=>{
		d.infect = d.outcome==0 ? getRandomArbitrary(0, 1) : 1
	})
  nodes.forEach(d=>{
  	d.color =  d.infect==1 ? "red": d.color
  })

	simulation.stop();

	simulation.nodes(nodes)

	simulation.alpha(0.5);

	simulation.restart();


}

function regroup() {

  simulation.stop();

  nodes.forEach(d=>{
  	console.log(d.label)
  	d.radius = d.outcome==1 ? 80 : d.radius
    d.fx = d.outcome==1 ? (crime.indexOf(d.label) * 340)+360 : null
    d.fy = d.outcome==1 ? height/2 : null
  })

  simulation.nodes(nodes)
  	.alphaDecay(.01)
    .force('charge', d3.forceManyBody().strength(-20))
    // to weaken pull towards fixed width and create a nice aesthetic circle
    // leave it at default strength and ensure forceX is not simply 'width/2'
    .force('x', d3.forceX(function(d) { return d.outcome==0 ? (crime.indexOf(d.label) * 340)+360 : d.fx }))
    .force('y', d3.forceY(function(d) { return d.outcome==0 ? height/2 : d.fy }))
    .force("collide", d3.forceCollide(function(d,i) { return d.radius + 5}))
    
  simulation.alpha(0.5);

  simulation.restart();

}

function shiftTop() {

	simulation.stop();

	// find count within each category 
	var counts = nodes.reduce((p, c) => {
	  var name = c.band;
	  if (!p.hasOwnProperty(name)) {
	    p[name] = 0;
	  }
	  p[name]++;
	  return p;
	}, {});

	countsExtended = Object.keys(counts).map(k => {
	  return {name: k, count: counts[k]}; });
	//console.log(countsExtended)

	yScaleCount.domain([0,d3.max(countsExtended, function(d) { return d.count })])

  nodes.forEach((d,i)=>{
  	d.hide = true,
  	d.radius = 18,
    d.x1 = xScaleDist(d.band)
  })
  console.log(nodes)
  
  simulation.nodes(nodes)
  	.alpha(.02)
    .force('charge', d3.forceManyBody().strength(-30))
    .force('x', d3.forceX(function(d) { return d.x1 }).strength(0.45))
    .force('y', d3.forceY(height/4))
    //.force("bounce", d3.forceBounce(function(d,i) { return d.radius }))
   	.force('container', d3.forceSurface()
		.surfaces([
			{from: {x:0,y:0}, to: {x:0,y:height/4}},
			{from: {x:0,y:height/4}, to: {x:width,y:height/4}},
			{from: {x:width,y:height/4}, to: {x:width,y:0}},
			{from: {x:width,y:0}, to: {x:0,y:0}}
		])
		.oneWay(true)
		.radius(d => d.radius)
	);

  simulation.alpha(0.5);

  simulation.restart();
}

function distribute() {

  nodes.forEach((d,i)=>{
  	d.hide = false,
  	d.radius = 18,
    d.x1 = xScaleDist(d.band),
    d.y1 = yScaleCount(countsExtended.find(b=>b.name==d.band).count),
    d.width = xScaleDist.bandwidth()
    //d.x = Math.max(d.radius, Math.min(width+d.width-d.radius, d.x1)),
    //d.y = Math.max(d.radius, Math.min(height-d.radius, d.y1))
  })

  simulation.stop();

  simulation.nodes(nodes)
  	.alphaDecay(.005)
  	.velocityDecay(0.6)
    .force('charge', d3.forceManyBody().strength(-30))
    .force('x', d3.forceX(function(d) { return d.x1 }).strength(0.45))
    .force('y', d3.forceY(function(d) { return d.y1 }).strength(0.2))
    //.force("bounce", d3.forceBounce(function(d,i) { return d.radius }))
   	.force('container', d3.forceSurface()
		.surfaces([
			{from: {x:0,y:0}, to: {x:0,y:height}},
			{from: {x:0,y:height}, to: {x:width,y:height}},
			{from: {x:width,y:height}, to: {x:width,y:0}},
			{from: {x:width,y:0}, to: {x:0,y:0}}
		])
		.oneWay(true)
		.radius(d => d.radius)
	);

  simulation.alpha(0.1);

  simulation.restart();

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
  }, 4000);
}

function execute1000(callback) {
  setTimeout(function() {
    callback();
  }, 1000);
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
