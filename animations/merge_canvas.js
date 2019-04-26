///////////////////////////////////////////////////////////////////////////
///////////////////////////////// Globals /////////////////////////////////
/////////////////////////////////////////////////////////////////////////// 
var simulation, countsExtended, nodesThree, gCircle, gCircle1
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

//SVG container to hold captions
var svg = d3.select('#chart')
  .append("svg")
  .attr("width", totalWidth)
  .attr("height", totalHeight)

var g = svg
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

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
  
var buffer = 400
var xScaleDist = d3.scaleBand()
  .range([buffer, width-buffer])
  .domain(["1", "2", "3", "4", "5", "6", "7", "8", "9"])

var yScaleCount = d3.scaleLinear()
	.range([height, height*(3/4)])
	

///////////////////////////////////////////////////////////////////////////
///////////////////////// Initialize the force ////////////////////////////
///////////////////////////////////////////////////////////////////////////

run();

function run() {

	execute1000(function() {
	  scatter(); // kick off simulation
	  execute(function() {
	  	distribute()
	 });
	});
	    
} 


///////////////////////////////////////////////////////////////////////////
/////////////////////// Modify simulation params //////////////////////////
///////////////////////////////////////////////////////////////////////////

function scatter() {

  var dummyData = []
  d3.range(1,4).map((d,i) => {
    dummyData.push({"outcome": 1, 'color': 'red', 'radius': 22, 'label':crime[i], 'band': "9"})
  })
  d3.range(1,400).map((d,i) => {
  	var rand = Math.round(randn_bm(1, 8, 0.7))
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

// not in use
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

// not in use as unable to make an aesthetic normal distribute shaped with the nodes using this method
function distribute() {

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
  	d.radius = 12,
    d.x1 = d.outcome==0 ? xScaleDist(d.band) : getRandomArbitrary(0, width),
    d.y1 = d.outcome==0 ? yScaleCount(countsExtended.find(b=>b.name==d.band).count) : height-100,
    d.width = xScaleDist.bandwidth()
    //d.x = Math.max(d.radius, Math.min(width+d.width-d.radius, d.x1)),
    //d.y = Math.max(d.radius, Math.min(height-d.radius, d.y1))
  })

  simulation.stop();

  simulation.nodes(nodes)
  	//.alphaDecay(.005)
  	.velocityDecay(0.2)
    .force('charge', d3.forceManyBody().strength(-30))
     .force("collide", d3.forceCollide(function(d,i) { return d.radius + 3}))
    .force('x', d3.forceX(function(d) { return d.x1 }).strength(0.2))
    .force('y', d3.forceY(function(d) { return d.y1 }).strength(0.3))
    //.force("bounce", d3.forceBounce(function(d,i) { return d.radius }))
   	.force('container', d3.forceSurface()
		.surfaces([
			{from: {x:buffer,y:0}, to: {x:buffer,y:height}},
			{from: {x:buffer,y:height}, to: {x:width-buffer,y:height}},
			{from: {x:width-buffer,y:height}, to: {x:width-buffer,y:0}},
			{from: {x:width-buffer,y:0}, to: {x:buffer,y:0}}
		])
		.oneWay(true)
		.radius(d => d.radius)
	);

  simulation.alpha(0.5);

  simulation.restart();

}

function infect() {

	simulation.stop()

	var nodesSaved = simulation.nodes()

	// change some nodes to red color
	// ensure a node from each category changes
	var nodesToRed = [10, 20, 30, 40, 50, 60, 70, 80, 90, 110, 120, 130, 140, 150, 160, 170, 180]
	// hide all nodes except for three random nodes
	var nodesToHighlight = [100, 200, 300]
	nodesSaved.forEach(d=>{
		d.infect = (nodesToRed.indexOf(d.id)!=-1 && d.radius > 18) ? 1 : 0
		d.fadeOut = nodesToHighlight.indexOf(d.id) == -1 ? true : false
	})

  var infected = nodesSaved.filter(d=>d.infect == 1)

 	gCircle = g.selectAll('.infected').data(infected)

	gCircle
		.enter().append('circle')
			.attr('class', "infected")
			.attr("fill", d=> "red") 
			.attr("fill-opacity", 0)
			.attr("cx", d=> d.x+d.radius/2)
			.attr("cy", d=> d.y+d.radius/2)
			.attr('r', d=>d.radius)
			.merge(gCircle)
			.transition().ease(d3.easeLinear).duration(1500)
			.attr("cx", d=> d.x+d.radius/2)
			.attr("cy", d=> d.y+d.radius/2)
			.attr('r', d=>d.radius*	1.25)
			.attr("fill-opacity", 1)

}

function migrate() {

	d3.selectAll('.infected').remove()
	d3.selectAll('canvas').remove()

	var nodesSaved = simulation.nodes()
	var nodesToHighlight = [100, 200, 300]
	nodesThree = nodesSaved.filter(d=>(nodesToHighlight.indexOf(d.id) != -1))

 	gCircle1 = g.selectAll('.threeleft').data(nodesThree)

	var entered_circles = gCircle1
		.enter().append('circle')
			.attr('class', "threeleft")
			.attr("fill", d=> d.color) 
			.attr("fill-opacity", 1)
			.attr('r', d=>d.radius)
			.attr("cx", d=> d.x+d.radius/2)
			.attr("cy", d=> d.y+d.radius/2)
			
	gCircle1 = gCircle1.merge(entered_circles)

	gText = g.selectAll('text').data(nodesThree)

	entered_text = gText
		.enter().append('text')
			.attr("font-family", "Helvetica")
			.attr("font-size", "22px")
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
  		.attr("cx", d=> d.x+d.radius/2)
			.attr("cy", d=> d.y+d.radius/2)
  }

  var labels = ['Shareholder X', 'Company A', 'Company B']

  setTimeout(function() {
		gCircle1
				.transition().ease(d3.easeLinear).duration(1500)
				.attr("fill", "white")
				.attr("stroke", "black")
				.attr('stroke-width', "4px")

		entered_text
				.merge(gText)
				.transition().ease(d3.easeLinear).duration(1500)
				.text((d,i)=> labels[i])
				.attr("x", d=>d.x)
				.attr("y", d=>d.y-25)
				.attr("fill-opacity", 1)

		gText.exit().remove()

	 }, 3500)
}


function cycleCaptions(sceneNumber) {

	var captions = [
	{text: "The complex and scattered world of data", x:width/2, y:50}, 
	{text: "We collect the data", x:width/2, y:height/50}, 
	{text: "We merge the data", x:width/2, y:height/50}, 
	{text: "We find insights based on current data", x:width/2, y:50}, 
	{text: "Financial crime spreads beyond individuals and firms. It is dynamic.", x:width/2, y:50}, 
	{text: "When a new crime arises, Who is good? Who is bad? Who is in between?", x:width/2, y:50}]

	var choice = captions[sceneNumber]

	gText = g.selectAll('text').data([choice])

	entered_text = gText
		.enter().append('text')
			.attr("font-family", "Helvetica")
			.attr("font-size", "32px")
			.attr("text-anchor", "middle")
			.attr("fill", "#111CFF") //refinitiv blue color
			.attr("fill-opacity", 0)
			.attr("x", width/2)
			.attr("y", 50)

	entered_text
			.merge(gText)
			.transition().ease(d3.easeCubic).duration(1000)
			.text(d=> d.text)
			.attr("x", d=> d.x)
			.attr("y", d=> d.y)
			.attr("fill-opacity", 1)

	gText.exit().remove()

}

function drawNode(d) {

	context.globalAlpha = 1;
	context.beginPath();
	context.moveTo(d.x + d.radius, d.y);
	context.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
	context.fillStyle = d.color;
	context.fill();
	context.closePath();	
	
}

function drawLinks(d) {

	context.globalAlpha = 1;
  context.strokeStyle = "black";
  context.lineWidth = 4; 
  context.beginPath();
  context.moveTo(d.source.x, d.source.y)
  context.lineTo(d.target.x, d.target.y)
  context.stroke();
  context.closePath();	
	
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
  }, 2000);
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
