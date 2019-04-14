var screenWidth = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var canvasDim = { width: screenWidth, height: screenHeight}

var margin = {top: -20, right: 5, bottom: 5, left: 5}
var width = canvasDim.width - margin.left - margin.right 
var height = canvasDim.width - margin.top - margin.bottom 
var radius = canvasDim.width * 0.4

var nodes = [] 
var links = []

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
var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

var simulation1 = d3.forceSimulation()
  .force("link", d3.forceLink().id(function(d) { return d.id; }))

d3.json("dummy_data.json", function(error, data) {
  if (error) throw error;

  data.nodes.map(function(d,i) {
    var radian = (2 * Math.PI) / data.nodes.length * i - (Math.PI / 2);
    nodes.push({
      id: d.id,
      size: 6,
      fill: 'black', // standardize empty black circle for each team
      stroke: 'black',
      type: 'country',
      fx: radius * Math.cos(radian) + (width / 2),
      fy: radius * Math.sin(radian) + (height / 2),
      value: d.value
    })
  })

  simulation1
      .nodes(nodes)
      .on("tick", update) // start simulation to update node positions

  simulation1.force("link")
      .links(data.links)

  simulation1.stop()

  for (var i = 0; i < 100; ++i) simulation1.tick()
  simulation1.alpha(1).alphaDecay(0.1).restart()

  enter()

  function enter() {

    gcircle = circleG.selectAll('circle')
      .data(nodes)
      .enter()
      .append('g')
      .classed('highlighted', false)

    circle = gcircle
      .append('circle')
      .attr('stroke-width', 2)

    gpath = pathG.selectAll('path')
      .data(data.links).enter()
      .append('g')
      .classed('highlighted', false)

    path = gpath
      .append('path')
      .attr('stroke-linecap', 'round')
  }

  function update() {

    circle.attr('r', 15)
      .attr('stroke', '#081EFF')
      .attr('fill', '#081EFF')
      .attr('cx', function(d) {return d.x})
      .attr('cy', function(d) {return d.y})
      .attr('id', function(d) {return "node-" + d.id.toString() + "-"})
      
    path.attr('stroke-width', '2px')
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
      .attr('opacity', 0)

  }

})

/*//////////////////////////////////////////////////////////  
/////////// Initiate the Center Texts //////////////////////
//////////////////////////////////////////////////////////*/
/*Create wrapper for center text*/
var textCenter = svg.append("g")
          .attr("class", "explanationWrapper");

/*Starting text middle top*/
var middleTextTop = textCenter.append("text")
  .attr("class", "explanation")
  .attr("text-anchor", "middle")
  .attr("x", width/2 + "px")
  .attr("y", height/2 + "px")
  .attr("dy", "1em")
  .text("Six Degrees of Separation")


/*//////////////////////////////////////////////////////////
//////////////// Storyboarding Steps ///////////////////////
//////////////////////////////////////////////////////////*/
var counter = 1

/*Reload page*/
d3.select("#reset")
  .on("click", function(e) {location.reload();});


/*Order of steps when clicking button*/
d3.select("#clicker")      
  .on("click", function(e){
  
    if(counter == 1) Draw1();
    else if(counter == 2) Draw2();
    else if(counter == 3) Draw3();
    else if(counter == 4) Draw4();
    else if(counter == 5) Draw5();
    else if(counter == 6) Draw6();
    else if(counter == 7) Draw7();
    else if(counter == 8) Draw8();
    else if(counter == 9) Draw9();
    else if(counter == 10) Draw10();
    else if(counter == 11) Draw11();
    else if(counter == 12) Draw12();
    else if(counter == 13) Draw13();
    else if(counter == 14) Draw14();
    else if(counter == 15) finalChord();
    
    counter = counter + 1;
  });

/*//////////////////////////////////////////////////////////  
//// 1 step link
///////////////////////////////////////////////////////////*/
function Draw1(){
    
  changeText(newText = "Imagine if a person is linked to the person next to him...", 
  delayDisappear = 0, delayAppear = 1);
  
  d3.selectAll("path")
    .filter(d=>d.type == '1 step')
    .transition().delay(700).duration(1000)
    .style("opacity", 1)
    
}

/*//////////////////////////////////////////////////////////  
//// 2 step link
///////////////////////////////////////////////////////////*/
function Draw2(){

  changeText(newText = "And also to the person 2 steps away from him", 
  delayDisappear = 0, delayAppear = 1);

  d3.selectAll("path")
    .filter(d=>d.type == '2 step')
    .transition().delay(700).duration(1000)
    .style("opacity", 1)
    
}

/*//////////////////////////////////////////////////////////  
//// Random step link
///////////////////////////////////////////////////////////*/
function Draw3(){
    
  changeText(newText = "Now, add some random connections.", 
  delayDisappear = 0, delayAppear = 1);

  d3.selectAll("path")
    .filter(d=>d.type == 'random')
    .transition().delay(700).duration(1000)
    .style("opacity", 1)
    
}

/*//////////////////////////////////////////////////////////  
//// Enable interactivity
///////////////////////////////////////////////////////////*/
function Draw4(){
  
  changeText(newText = "Let's select the criminal and a random person. Based on their direct links, they are not connected.", 
  delayDisappear = 0, delayAppear = 1);

  // dim all circles
  d3.selectAll('circle')
    .attr('opacity', 0.1)

  // dim all lines
  d3.selectAll("path")
    .transition().duration(100)
    .attr("stroke-opacity", 0.1)

  execute(function() {
    toHighlightDegree1("6")
    execute(function() {
      toHighlightDegree1("1")
    });
});
    
}

/*//////////////////////////////////////////////////////////  
//// Identify shortest path
///////////////////////////////////////////////////////////*/
function Draw5(){
    
  changeText(newText = "However, if we increase the degree of separation of the criminal to 2, we will be able to find a connection between them.", 
  delayDisappear = 0, delayAppear = 1, yloc = 50);

  execute(function() {
    toHighlightDegree2("6")
    execute(function() {
      findShortestPath()
    });
  });
    
}

/*//////////////////////////////////////////////////////////  
//// Check degree of separation for all people to criminal
///////////////////////////////////////////////////////////*/
function Draw6(){
    
  changeText(newText = "If we test the degree of separation of each person to the criminal, you will find that everyone has a relation to the criminal with six degrees of separation or less.", 
  delayDisappear = 0, delayAppear = 1, yloc = 50);

  execute(function() {
    toUnHighlight()
    execute(function() {
      showLabels()
    });
  });
    
}

/*//////////////////////////////////////////////////////////  
//// Create a force layout
///////////////////////////////////////////////////////////*/
function Draw7(){
    
  changeText(newText = "", 
  delayDisappear = 0, delayAppear = 1, yloc = 50);

  d3.json("dummy_data.json", function(error, data) {
    if (error) throw error;

    simulation
      .nodes(data.nodes)
      .on("tick", ticked);

    simulation.force("link")
      .links(data.links);

    function ticked() {
      path
        .transition().duration(1000)
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

      circle
          .transition().duration(1000)
          .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
          })
    }
  })

}


function toHighlightDegree1(el) {

  // select network of links generating from the node: 2nd degree of separation
  d3.selectAll("path[id*='" + "-" + el + "-" + "']").each(function(d,i){
    conn_ids = d3.select(this).attr("id").match(/[0-9]+/g)
    for (var id = 0; id < conn_ids.length; id++) {

      // select connected nodes
      d3.selectAll("circle[id*='" + "-" + conn_ids[id] + "-" + "']")
        .transition().duration(100)
        .attr("opacity", 1)
        .attr('class', 'highlighted-circle') 
        
    }
  })

  // select network of links generating from the node: 1st degree of separation
  d3.selectAll("path[id*='" + "-" + el + "-" + "']")
    .transition().duration(100)
    .attr("stroke-opacity", 1)
    .attr("stroke-width", "2px")
    .attr('stroke', function(d){ return colorScale(d.type) }) 
    .attr('class', 'highlighted-path')

  // select main node
  d3.select('#node-' + el + '-')
    .transition().duration(100)
    .attr("r", 30) 
    .attr('opacity', 1)
    .attr('class', 'highlighted-circle')     
   
}


function toHighlightDegree2(el) {

  d3.selectAll("path[id*='" + "-" + el + "-" + "']").each(function(d,i){

    conn_ids = d3.select(this).attr("id").match(/[0-9]+/g)
    for (var id = 0; id < conn_ids.length; id++) {

      if(conn_ids[id] == el) {
        d3.selectAll("path[id*='" + "-" + conn_ids[id] + "-" + "']")
          .transition().duration(100)
          .attr("stroke-opacity", 1)
          .attr('stroke', function(d){ return colorScale(d.type) }) 
          .attr('class', 'highlighted-path')       
      } else {
        d3.selectAll("path[id*='" + "-" + conn_ids[id] + "-" + "']")
          .transition().duration(100)
          .attr("stroke-opacity", 1)
          .attr('stroke', 'black')
          .attr('class', 'highlighted-path')  
      }

      d3.selectAll("path[id*='" + "-" + conn_ids[id] + "-" + "']").each(function(d,i){

        conn_ids1 = d3.select(this).attr("id").match(/[0-9]+/g)
        for (var id1 = 0; id1 < conn_ids1.length; id1++) {
          if(conn_ids1[id1] != el) {
            d3.selectAll("circle[id*='" + "-" + conn_ids1[id1] + "-" + "']")
              .transition().duration(100)
              .attr("opacity", 1)
              .attr('fill', '#081EFF')
              .attr('stroke', '#081EFF')
              .attr('class', 'highlighted-circle') 
          }
        }

      })

    }

  })

  d3.select('link-source-6-target-8-').transition().duration(100).attr('stroke', '#081EFF') // bug that needs to be fixed

}

function toUnHighlight() {

  d3.selectAll('circle')
    .transition().duration(100)
    .attr("r", 15) 
    .attr('stroke', '#081EFF')
    .attr('fill', '#081EFF')
    .attr('opacity', 1)

    .attr('class', 'not-highlighted-circle')  

  d3.selectAll("path")
    .transition().duration(100)
    .attr("stroke-opacity", 1)
    .attr('stroke', function(d){ return colorScale(d.type) }) 
    .attr('class', 'not-highlighted-path') 

  d3.select("#node-6-").transition().duration(100).attr('stroke', '#ff8000').attr('r', 30)

}

function findShortestPath() {

  d3.select('#link-source-1-target-2-').transition().duration(100).attr('stroke', '#ff8000')
  d3.select('#link-source-2-target-4-').transition().duration(100).attr('stroke', '#ff8000')
  d3.select('#link-source-4-target-6-').transition().duration(100).attr('stroke', '#ff8000')
  d3.select('#link-source-4-target-6-').transition().duration(100).attr('stroke', '#ff8000')
  d3.select("#node-6-").transition().duration(100).attr('stroke', '#ff8000')
  d3.select("#node-1-").transition().duration(100).attr('stroke', '#ff8000')
  d3.select("#node-2-").transition().duration(100).attr('stroke', '#ff8000').attr('fill', '#ff8000')
  d3.select("#node-4-").transition().duration(100).attr('stroke', '#ff8000').attr('fill', '#ff8000')

}

function showLabels() {

  textG.selectAll('text')
    .data(nodes).enter().append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .attr('fill', 'white')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .text(d=>d.value)

}

function execute(callback) {
  setTimeout(function() {
    callback();
  }, 1000);
}

/*Transition the text*/
function changeText (newText, delayDisappear, delayAppear, finalText, xloc, yloc, w) {

  /*If finalText is not provided, it is not the last text of the Draw step*/
  if(typeof(finalText)==='undefined') finalText = false;
  if(typeof(yloc)==='undefined') yloc = height/2-20;
  if(typeof(xloc)==='undefined') xloc = width/2;
  if(typeof(w)==='undefined') w = 350;

  middleTextTop
    .attr('opacity', 0)  // Current text disappear
    .text(newText)
    .attr("y", yloc + "px")
    .attr("x", xloc + "px")
    .transition().delay(700 * delayAppear).duration(1000)
    .attr('opacity', 1) // New text appears
    .call(wrap, w)
    
}


/*Taken from http://bl.ocks.org/mbostock/7555321
//Wraps SVG text*/
function wrap(text, width) {
  text.each(function(){
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.4, 
        y = text.attr("y"),
    x = text.attr("x"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
    
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      };
    };  
  })
};

