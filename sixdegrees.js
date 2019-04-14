var screenWidth = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
var canvasDim = { width: screenWidth, height: screenHeight}

var margin = {top: 20, right: 20, bottom: 20, left: 20}
var width = canvasDim.width - margin.left - margin.right 
var height = canvasDim.width - margin.top - margin.bottom 
var radius = canvasDim.width * 0.45

var nodes = [] 
var links = []

var colorScale = d3.scaleOrdinal()
  .range(["#081EFF", "#081EFF", "#081EFF"])
  .domain(["1 step", "2 step", 'random'])

var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var pathG = svg.append("g")
  .attr("class", "pathG")
 
var circleG = svg.append("g")
  .attr("class", "circleG")

// Initialize force simulation
var simulation1 = d3.forceSimulation()
  .force("link", d3.forceLink()
    .id(function(d) { return d.id; })
  )
  .force("collide", d3.forceCollide().radius(function(d) { return d.size * 1.3 }))

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
      fy: radius * Math.sin(radian) + (height / 2)
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

    circle.attr('r', 16)
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
      });


  }

  var arr_ids = []
  var graph = {}
  interactivity()

  function interactivity() {
    gcircle
      .on("click", function(d,i) {

        arr_ids.push(d.id) // recognize which nodes have been selected already

        // if node has not been selected yet
        if(d3.select(this).attr("class") != 'highlighted'){

          d3.select(this)
            .style("cursor", "pointer")
            .classed('highlighted', true)

          // dim all circles
          d3.selectAll('circle')
            .style('opacity', 0.1)

          // dim all lines
          d3.selectAll("path")
            .transition().duration(100)
            .style("stroke-opacity", 0.1)

          arr_ids.map(e => {

            // select network of links generating from the node: 2nd degree of separation
            d3.selectAll("path[id*='" + "-" + e + "-" + "']").each(function(d,i){
              conn_ids = d3.select(this).attr("id").match(/[0-9]+/g)
              graph[d.id] = {conn_ids} 
              graph
              for (var id = 0; id < conn_ids.length; id++) {

                d3.selectAll("path[id*='" + "-" + conn_ids[id] + "-" + "']")
                  .transition().duration(100)
                  .style("stroke-opacity", 1)
                  .style('stroke', 'black')
                  .attr('class', 'highlighted-path')    

                // select connected nodes
                d3.selectAll("circle[id*='" + "-" + conn_ids[id] + "-" + "']")
                  .transition().duration(100)
                  .style("opacity", 1)
                  .attr('class', 'highlighted-circle') 

                d3.selectAll("path[id*='" + "-" + conn_ids[id] + "-" + "']").each(function(d,i){
                  graph[conn_ids[id]] = {conn_ids1} 
                  conn_ids1 = d3.select(this).attr("id").match(/[0-9]+/g)
                  for (var id1 = 0; id1 < conn_ids1.length; id1++) {
                    d3.selectAll("circle[id*='" + "-" + conn_ids[id1] + "-" + "']")
                      .transition().duration(100)
                      .style("opacity", 1)
                      .attr('class', 'highlighted-circle') 
                  }
                })          
              }
            })

            // select network of links generating from the node: 1st degree of separation
            d3.selectAll("path[id*='" + "-" + e + "-" + "']")
              .transition().duration(100)
              .style("stroke-opacity", 1)
              .style('stroke', function(d){ return colorScale(d.type) }) 
              .attr('class', 'highlighted-path')

            // select main node
            d3.select('#node-' + e + '-')
              .transition().duration(100)
              .attr("r", 30) 
              .style('opacity', 1)
              .attr('class', 'highlighted-circle')     

          })
         
      } else {

          d3.select(this)
            .style("cursor", "default")
            .classed('highlighted', false)

          d3.selectAll('circle')
            .transition().duration(100)
            .attr("r", 16) 
            .style('opacity', 1)
            .attr('class', 'not-highlighted-circle')  

          d3.selectAll("path")
            .transition().duration(100)
            .style("stroke-opacity", 1)
            .style('stroke', function(d){ return colorScale(d.type) }) 
            .attr('class', 'not-highlighted-path') 

          arr_ids = []
      }

    })

  }

})
