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
var data = {"nodes": [], "links": []}

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
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(function(d) {return 300}).strength(0.1))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(function(d,i) { return 16}))

var simulation1 = d3.forceSimulation()
  .force("link", d3.forceLink().id(function(d) { return d.id; }))

function enter(nodes, links) {

  entered_circle = circleG.selectAll('circle').data(nodes)

  gcircle = entered_circle
    .enter().append('g')
    .classed('highlighted', false)

  circle = gcircle
    .append('circle')
    .attr('stroke-width', 2)
    .merge(d3.selectAll('circle'))

  entered_path = pathG.selectAll('path').data(links)

  gpath = entered_path
    .enter().append('g')
    .classed('highlighted', false)

  path = gpath
    .append('path')
    .attr('stroke-linecap', 'round')
    .merge(d3.selectAll('path'))

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
    .attr('opacity', 0)

}

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
  .text("FIGHTING FINANCIAL CRIME WITH AI")


/*//////////////////////////////////////////////////////////
//////////////// Storyboarding Steps ///////////////////////
//////////////////////////////////////////////////////////*/
var counter = 1

/*Reload page*/
d3.select("#reset")
  .on("click", function(e) {location.reload();});


/*Select force layout*/
d3.select("#force")
  .on("click", function(e) {Draw7()})

/*Order of steps when clicking button*/
d3.select("#clicker")      
  .on("click", function(e){
  
    if(counter == 1) Draw4();
    else if(counter == 2) Draw2();
    else if(counter == 3) Draw3();
    else if(counter == 4) Draw3_1();
    else if(counter == 5) Draw3_2();
    else if(counter == 6) Draw3_3();
    else if(counter == 7) Draw3_4();
    else if(counter == 8) Draw3_5();
    else if(counter == 9) Draw3_6();
    else if(counter == 10) Draw3_7();
    else if(counter == 11) Draw4();

    counter = counter + 1;
  });

/*//////////////////////////////////////////////////////////  
//// SECTION HEADERS
///////////////////////////////////////////////////////////*/
function Draw1(){
  changeText(newText = "FIGHTING FINANCIAL CRIME WITH AI", 
  delayDisappear = 0, delayAppear = 1);
}

function Draw2(){
  changeText(newText = "Problem statement: Information Overload, Managing Risk, False Positives", 
  delayDisappear = 0, delayAppear = 1);
}

function Draw3(){
  changeText(newText = "Understanding Graph Networks", 
  delayDisappear = 0, delayAppear = 1);

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

    links = data.links

    simulation1
        .nodes(nodes)
        .on("tick", update) // start simulation to update node positions

    simulation1.force("link")
        .links(links)

    simulation1.stop()

    for (var i = 0; i < 100; ++i) simulation1.tick()
    simulation1.alpha(1).alphaDecay(0.1).restart()

    enter(nodes, links)

  })

}

function Draw4(){
  changeText(newText = "Case study: Unraveling risk", 
  delayDisappear = 0, delayAppear = 1);
}

/*//////////////////////////////////////////////////////////  
//// 1 step link, 2-step link, random
///////////////////////////////////////////////////////////*/
function Draw3_1(){
    
  execute(function() {

    changeText(newText = "Imagine if a person is linked to the person next to him...", 
    delayDisappear = 0, delayAppear = 1);

    d3.selectAll("path")
      .filter(d=>d.type == '1 step')
      .transition().delay(700).duration(1000)
      .style("opacity", 1)

    execute(function() {

      changeText(newText = "And also to the person 2 steps away from him", 
      delayDisappear = 0, delayAppear = 1);

      d3.selectAll("path")
        .filter(d=>d.type == '2 step')
        .transition().delay(700).duration(1000)
        .style("opacity", 1)

      execute(function() {

        changeText(newText = "Now, add some random connections.", 
        delayDisappear = 0, delayAppear = 1);

        d3.selectAll("path")
          .filter(d=>d.type == 'random')
          .transition().delay(700).duration(1000)
          .style("opacity", 1)

      })

    });
  });
        
}

/*//////////////////////////////////////////////////////////  
//// Enable interactivity
///////////////////////////////////////////////////////////*/
function Draw3_2(){
  
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
function Draw3_3(){
    
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
function Draw3_4(){
    
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
function Draw3_5(){
    
  changeText(newText = "", 
  delayDisappear = 0, delayAppear = 1, yloc = 50);

  execute(function() {

    d3.json("dummy_data.json", function(error, data) {
      if (error) throw error;
      
      simulation
        .nodes(data.nodes)
        .on("tick", update);

      simulation.force("link")
        .links(data.links);

      simulation.stop()

      enter(data.nodes, data.links)
      d3.selectAll('path').style('opacity', 1)

      for (var i = 0; i < 100; ++i) simulation.tick()
      simulation.alpha(1).alphaDecay(0.1).restart()

    })

    execute(function() {
      
      d3.selectAll('text').remove()
      d3.select('#link-source-1-target-2-').transition().duration(100).attr('stroke', '#ff8000')
      d3.select('#link-source-2-target-4-').transition().duration(100).attr('stroke', '#ff8000')
      d3.select('#link-source-4-target-6-').transition().duration(100).attr('stroke', '#ff8000')
      d3.select('#link-source-4-target-6-').transition().duration(100).attr('stroke', '#ff8000')
      d3.select("#node-6-").transition().duration(100).attr('stroke', '#ff8000').attr('fill', '#ff8000')
      d3.select("#node-1-").transition().duration(100).attr('stroke', '#ff8000').attr('fill', '#ff8000')
      d3.select("#node-2-").transition().duration(100).attr('stroke', '#ff8000').attr('fill', '#ff8000')
      d3.select("#node-4-").transition().duration(100).attr('stroke', '#ff8000').attr('fill', '#ff8000')

    });
  });

}

/*//////////////////////////////////////////////////////////  
//// Create a scatter plot of good vs bad guys
///////////////////////////////////////////////////////////*/
function Draw4(){
    
  changeText(newText = "", 
  delayDisappear = 0, delayAppear = 1, yloc = 50);
  var pack=true
  var xScale = d3.scaleLinear()
  var yScale = d3.scaleLinear()
  var colorScale = d3.scaleLinear()
    .domain(["a", "b"])
    .range(["red", "blue"])

  var data = [
      {
          x: 10,
          y: 1000,
          id: "a"
      }, {
          x: 10,
          y: 1000,
          id: "b"
      }, {
          x: 5,
          y: 1200,
          id: "c"
      }
  ]

    // Height/width of the drawing area itself
    let chartHeight = height - margin.bottom - margin.top;
    let chartWidth = width - margin.left - margin.right;


    // Use the data-join to create the svg (if necessary)
    let ele = d3.select('body');
    let svg = ele
        .selectAll("svg")
        .attr('width', width)
        .attr("height", height)
        .data([data]);

    // Append static elements (i.e., only added once)
    let gEnter = svg
        .enter()
        .append("svg")
        .append("g");

    // g element for markers
    gEnter
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('height', chartHeight)
        .attr('width', chartWidth)
        .attr('class', 'chartG');

    // Define data
    if (pack === true) {

        // Create a packing function to pack circles
        let size = d3.min([width, height]);
        let packer = d3
            .pack()
            .size([size, size]);

        // Nest your data *by group* using d3.nest()
        let nestedData = d3
            .nest()
            .key(function (d) {
                return d['id'];
            })
            .entries(data);

        // Define a hierarchy for your data using d3.hierarchy
        let root = d3.hierarchy({
            values: nestedData
        }, function (d) {
            return d.values;
        })
        .sum(function (d) {
            return 1;
        });

        // (Re)build your pack hierarchy data structure by passing your `root` to your
        // `pack` function
        packer(root);
        chartData = root
            .descendants()
            .filter((d) => d.depth != 0)
            .map(function (d) {
                return {
                    x: d.x,
                    y: d.y,
                    id: d.data.id,
                    color: 'blue',
                    r: 3,
                    container: d.depth == 1
                }
            });

        xMin = d3.min(chartData, (d) => d.x)
        xMax = d3.max(chartData, (d) => d.x)
        // Adjust for margins
        let shift = margin.left;
        let range = [
            xMin - shift,
            xMax - shift
        ]
        xScale
            .domain([xMin, xMax])
            .range(range)
        yMin = d3.min(chartData, (d) => d.y)
        yMax = d3.max(chartData, (d) => d.y)
        yScale
            .domain([yMin, yMax])
            .range([yMin, yMax])
        radius = (d) => d.r

    } else if (xSwarm === true) {

        let tmp = data.swarm.map((d) => d);
        let simulation = d3.forceSimulation(tmp)
            .force("x", d3.forceX(function (d) { return xScale(d.x); }).strength(1))
            .force("y", d3.forceY(height / 2))
            .force("collide", d3.forceCollide(8))
            .stop();

        for (var i = 0; i < 50; ++i) simulation.tick();
        chartData = tmp.map((d) => {
            return {
                id: d.id,
                x: xScale.invert(d.x),
                y: yScale.invert(d.y),
                color: d.color
            }
        });
    }
    else {
        chartData = data.scatter.map((d) => {
            return {
                x: d.x,
                y: d.y,
                color: d.color,
                id: d.id
            }
        })
    }


    // Draw markers
    let circles = ele
        .select('.chartG')
        .selectAll('circle')
        .data(chartData, function (d) {
            return d.id
        })

    // Use the .enter() method to get entering elements, and assign initial position
    circles
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.x))
        .attr('cy', (d) => yScale(d.y))
        .attr('r', (d) => radius(d))
        .style('fill', function (d) {
            console.log(d)
            return d.container == true
                ? 'none'
                : colorScale(d.id)
        })
        .merge(circles)
        .style('opacity', (d) => showCircles === true ? .4 : 0)
        .transition()
        .duration(1500)
        .delay(700)
        .style('stroke', (d) => d.container == true
            ? 'black'
            : 'none')
        .style('fill', function (d) {
            return d.container == true
                ? 'none'
                : colorScale(d.id)
        })
        .attr('cx', (d) => xScale(d.x))
        .attr('cy', (d) => yScale(d.y))
        .attr('r', (d) => radius(d));


    // Use the .exit() and .remove() methods to remove elements that are no longer
    // in the data
    circles
        .exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();


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

  d3.select("#node-6-").transition().duration(100)
    .attr('stroke', '#ff8000')
    .attr('fill', '#ff8000')
    .attr('r', 30)

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
    .attr('x', function(d) {return d.x})
    .attr('y', function(d) {return d.y})
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

