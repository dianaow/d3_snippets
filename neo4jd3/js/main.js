//////////////////// Set up and initiate svg containers ///////////////////
var margin = {
  top: -140,
  right: 90,
  bottom: 60,
  left: 120
};
var totalWidth = 1250;
var totalHeight = 1600;
var width = totalWidth - margin.left - margin.right;
var height = totalHeight - margin.top - margin.bottom;

var svg = d3.select('#chart')
  .append("svg")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
  .append("g")
    .attr("transform", "translate(" + (margin.left + width/2) + "," + (margin.top) + ")")

var nodes = svg.append('g')
  .attr('class', 'nodes')

var links = svg.append('g')
  .attr('class', 'links')

function sq(x) { return x*x ; }

///////////////////////////// Set-up voronoi //////////////////////////////

var voronoi = d3.voronoi()
  .x(function(d) { return d.x; })
  .y(function(d) { return d.y; })
  .extent([[-margin.left - width/2, -margin.top], [width/2 + margin.right, height + margin.bottom]]);

var diagram;

//////////////////////////// Read in the data /////////////////////////////
//Create two arrays that will be global variables that hold the data
var nodesSave,
    linkSave;

function init() {

  d3.queue()   
    .defer(d3.csv, 'https://raw.githubusercontent.com/dianaow/dianaow.github.io/master/forcelayout/data/nodes_filt_entity.csv')
    .defer(d3.csv, 'https://raw.githubusercontent.com/dianaow/dianaow.github.io/master/forcelayout/data/nodes_officer_sea.csv')
    .defer(d3.csv, 'https://raw.githubusercontent.com/dianaow/dianaow.github.io/master/forcelayout/data/nodes_edges_sea.csv')  
    .await(transformData);  

}

function transformData(error, entity, officer, edges) {

  ////////////////////////////// Data Processing ///////////////////////////////

	var parseDate = d3.timeParse("%d-%b-%Y")

  var entity_new = entity.map((d,i) => {
    return {
      node_id: +d.node_id,
      name: d.name,
      incorporation_date: d.incorporation_date ? parseDate(d.incorporation_date.toLowerCase()) : "",
      countries: d.countries.includes(";") ? d.countries.split(";")[0] : d.countries
    } 
  })

  var officer_new = officer.map((d,i) => {
    return {
      node_id: +d.node_id,
      name: d.name,
      countries: d.countries
    }
  })

  var edges_new = edges.map((d,i) => {
    return {
      start_id: +d.START_ID,
      end_id: +d.END_ID,
      type: d.TYPE,
      link: d.link,
      start_date: d.start_date ? parseDate(d.start_date) : "",
      end_date: d.end_date ? parseDate(d.end_date) : "",
    }
  })

  officer_new = officer_new.filter(d=>d.countries=='Singapore')
  var edges_matched = edges_new.map((d,i) => {
    return Object.assign({}, d, officer_new.find(b=>b.node_id===d.start_id) ||{});
  })

  // data cleaning: since entities that lack a corresponding officer name or date, remove them
  edges_matched = edges_matched.filter(d=> (d.start_date != null) & ( d.start_date != ""))
  edges_matched = edges_matched.filter(d=> (d.name != undefined) & (d.name != null))

  // data cleaning: remove duplicate start and end node_ids
  edges_matched = edges_matched.filter((thing, index, self) =>
    index === self.findIndex((t) => (
      t.start_id === thing.start_id && t.end_id === thing.end_id
    ))
  )

  ////////////////////////////// Create nodes ///////////////////////////////
  var data = {}
  data.nodes = []
  data.relationships = []

  officer_new.map((d,i) => {
  	var tmp = {
      'id': d.node_id,
      'labels': ['Officer'],
      'properties': {'name': d.name, 'country': d.countries}, 
      'fill': 'red',
      'radius': 4
    }
  	data.nodes.push(tmp) 
  })

  entity_new.map((d,i) => {
  	var tmp = {'id': d.node_id, 
      'labels': ['Entity'], 
      'properties': {'name': d.name, 'country': d.countries, 'incorporation_date': d.incorporation_date},
      'fill': 'blue',
      'radius': 8
    }
  	data.nodes.push(tmp) 
  })

  diagram = voronoi(data.nodes)
  nodesSave = nodes
  drawNodes(nodes)

  ////////////////////////////// Create links ///////////////////////////////

  edges_matched.map((d,i) => {
  	var tmp = {
  		'id': i, 
  		'type': d.type, 
  		//'startNode': d.start_id, 
  		'endNode': d.end_id,
  		'source': d.start_id,
  		'target': d.end_id,
  		"linknum": i,
  		'properties': {'link': d.link, 'start_date': d.start_date, 'end_date': d.end_date}}
  	data.relationships.push(tmp) 
  })
  //console.log(data)

  data.relationships.forEach(d=>{
    d.sign = Math.random() > 0.5;
    d.r = Math.sqrt(sq(d.target.x - d.source.x) + sq(d.target.y - d.source.y)) * 2;
    //Find center of the arc function
    var centers = findCenters(d.r, d.source, d.target);
    d.center = d.sign ? centers.c2 : centers.c1;
  })

  linkSave = links;
  drawLinks(links)


}

/////////////////////////////// Draw the nodes ////////////////////////////

function drawNodes(data) {

  var gnodes = nodes.selectAll('.node-group').data(data, d=>d.id) 

  var entered_nodes = gnodes.enter().append('g')
    .attr("class", "node-group")

  entered_nodes
    .merge(gnodes)
    .attr("transform", function(d,i) { 
      return "translate(" + d.x + "," + d.y + ")" 
    })

  gnodes.exit().remove()

  entered_nodes
    .append("circle")
    .merge(gnodes.select('circle'))
      .attr('id', (d,i)=> 'circle-' + d.id)
      .attr('r', d=>d.radius)
      .attr('stroke', 'black')
      .attr('stroke-width', '1px')
      .attr('fill', d=>d.fill)
      .attr('fill-opacity', 1)

}

////////////////////////////// Draw the links ////////////////////////////

function drawLinks(data) {

  glines = lines.selectAll('.line-group').data(data, d=>d.id)

  var entered_lines = glines.enter().append('g')
    .attr('class', 'line-group')
    
  glines.exit().remove()

  entered_lines
    .append('path')
      .attr('class', 'connector')
    .merge(glines.select('path'))
      .attr('id', (d,i)=> 'line-' + d.id) 
      .attr('d', d => arcGenerator(d.values))
      .style('stroke', 'black')
      .style('fill', 'none')
      .style('opacity', 1)
      .style('stroke-width', 1.5)
      .style("visibility", "hidden")

}

function findCenters(r, p1, p2) {
  // pm is middle point of (p1, p2)
  var pm = { x : 0.5 * (p1.x + p2.x) , y: 0.5*(p1.y+p2.y) } ;
  // compute leading vector of the perpendicular to p1 p2 == C1C2 line
  var perpABdx= - ( p2.y - p1.y );
  var perpABdy = p2.x - p1.x;
  // normalize vector
  var norm = Math.sqrt(sq(perpABdx) + sq(perpABdy));
  perpABdx/=norm;
  perpABdy/=norm;
  // compute distance from pm to p1
  var dpmp1 = Math.sqrt(sq(pm.x-p1.x) + sq(pm.y-p1.y));
  // sin of the angle between { circle center,  middle , p1 } 
  var sin = dpmp1 / r ;
  // is such a circle possible ?
  if (sin<-1 || sin >1) return null; // no, return null
  // yes, compute the two centers
  var cos = Math.sqrt(1-sq(sin));   // build cos out of sin
  var d = r*cos;
  var res1 = { x : pm.x + perpABdx*d, y: pm.y + perpABdy*d };
  var res2 = { x : pm.x - perpABdx*d, y: pm.y - perpABdy*d };
  return { c1 : res1, c2 : res2} ;  
}

function drawCircleArc(c, r, p1, p2, side) {
  var ang1 = Math.atan2(d.a.y-c.y, p1.x-c.x);
  var ang2 = Math.atan2(p2.y-c.y, p2.x-c.x);

  var arcGenerator = d3.arc()
    .x(d=>d.x)
    .x(d=>d.y)
    .innerRadius(d=>d.radius)
    .startAngle(ang)
    .endAngle(2 * Math.PI)

}

window.onload = init;