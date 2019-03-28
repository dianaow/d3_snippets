var margin = {top: 20, right: 20, bottom: 20, left: 20}
var width = (screen.width < 420 ? screen.width*0.7 : ((screen.width >= 768 & screen.width <= 1024) ? screen.width*0.8 : screen.width*0.4)) - margin.left - margin.right // responsive design
var height = (screen.width < 420 ? screen.width*0.7 : ((screen.width >= 768 & screen.width <= 1024) ? screen.width*0.8 : screen.width*0.4)) - margin.top - margin.bottom // responsive design

var screenWidth = screen.width > 1600 ? 1250 : Math.max(document.documentElement.clientWidth) * 0.85 // responsive design
var screenHeight = screen.width > 1600 ? 800 : Math.max(document.documentElement.clientHeight) * 0.85 // responsive design
var width1 = screenWidth - margin.left - margin.right
var height1 = screenHeight - margin.top - margin.bottom

var width2 = (screen.width <= 1024 ? width1 : width1)
var height2 = (screen.width <= 1024 ? height1*0.75*0.4 : height1*0.75)

if(screen.width <= 1024){
  var graph = d3.select('.view2-mobile')
} else {
  var graph = d3.select('.view2-desktop')
}

var svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)

svg.append('rect')
  .attr("width", "100%")
  .attr("height", "100%")
  .attr('fill', 'navy')

svg.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

var svg1 = d3.select("#chart1").append("svg")
  .attr("width", width1 + margin.left + margin.right)
  .attr("height", height1 + margin.top + margin.bottom)

svg1.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg1.append('rect')
  .attr("width", "100%")
  .attr("height", "100%")
  .attr('fill', 'gold')

var svg2 = graph.select("#chart2").append("svg")
  .attr("width", width2 + margin.left + margin.right)
  .attr("height", height2 + margin.top + margin.bottom)

svg2.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg2.append('rect')
  .attr("width", "100%")
  .attr("height", "100%")
  .attr('fill', 'red')

// CREATE LEGEND // 
var legendX = 40
var legendY = 0
var R = (screen.width < 420 ? 10 : 6) // responsive design
var category = [{color:'navy', label:"1"},
 {color:'gold', label:"2"}, 
 {color:'DarkOrange', label:"3"},
 {color:'red', label:">3 seasons"}]

var svgLegend = graph.select("#chart_legend").append("svg")
  .attr("width", 260)
  .attr("height", 30)
.append("g")
  .attr('class', 'gLegend')
  .attr("transform", "translate(" + 50 + "," + 10 + ")");

var legend = svgLegend.selectAll('.legend')
  .data(category)
  .enter().append('g')
    .attr("class", "legend")
    .attr("transform", function (d, i) {return "translate(" +  i * legendX + "," + i * legendY + ")"})

legend.append("circle")
    .attr("class", "legend-node")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", R)
    .style("fill", d=>d.color)

legend.append("text")
    .attr("class", "legend-text")
    .attr("x", R*2)
    .attr("y", R/2)
    .style("fill", "#A9A9A9")
    .style("font-size", 12)
    .text(d=>d.label)

