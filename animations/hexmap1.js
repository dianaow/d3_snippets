var hexmap = function hexmap() {

  //________________________________________________
  // GET/SET defaults
  //________________________________________________

  var width =  1200
  var height = 600
  var margin = { top: 20, right: 10, bottom: 20, left: 10 }

  var hexbin = d3.hexbin().size([width, height]).radius(5);
  var modal = d3.select('#vis')
  var canvas = modal.append('canvas').attr('width', width).attr('height', height).attr('id', 'mapCanvas');
  var context = canvas.node().getContext('2d');

  var countries = [
    {'country': 'Singapore', '1': 5, '0.9': 10, '0.8': 10, '0.7': 10, '0.6': 10, '0.5': 10, '0.4': 1, '0.3': 2, '0.2': 3, '0.1': 10},
    {'country': 'Japan', '1': 5, '0.9': 10, '0.8': 10, '0.7': 10, '0.6': 10, '0.5': 10, '0.4': 1, '0.3': 2, '0.2': 3, '0.1': 10},
    {'country': 'Russia', '1': 5, '0.9': 10, '0.8': 10, '0.7': 10, '0.6': 10, '0.5': 10, '0.4': 1, '0.3': 2, '0.2': 3, '0.1': 10}
  ]
  var countries = ['Singapore', 'Japan', 'Russia']
  var colorScale = d3.scaleOrdinal()
      .domain(['0-0.3', '0.3-0.5', '0.5-0.7', '0.7-0.9', '1'])
      .range(['#73D055FF', '#29AF7FFF', '#238A8DFF', '#33638DFF', '#440154FF'])

  var projection = d3
     .geoEquirectangular()
     .center([0, 0]) // set centre to further North
     .scale(width / 2 / Math.PI) // scale to fit group width
     .translate([width / 2, height / 2]) // ensure centred in group

  var path = d3.geoPath(projection, context);
  var path1 = d3.geoPath(projection);

  var svg = modal.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "map")

  countriesGroup = svg.append("g")
   
  var global_sel_centroids = []

  execute(function() {
    // difficult to get centroid, hence laying another map behind to store array of centroid locations
    // also, helps to sanity check hexagon location
    execute(function() {
      normal_map()
      hex_map()
    })
  })

  function normal_map() {
    d3.json("https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json", function(error, json) {

      // draw a path for each feature/country
      countriesPaths = countriesGroup
         .selectAll("path")
         .data(json.features)
         .enter()
         .append("path")
         .attr("d", path1)
         .attr("id", function(d, i) {
            return "country" + d.properties.name;
         })
         .attr("class", "country")

      var centroids = []
      json.features.map(d=> {
        centroids.push([d.properties.name, path.centroid(d)[0], path.centroid(d)[1]])
      })
      sel_centroids = centroids.filter(function(d){ return countries.indexOf(d[0]) != -1 })
      global_sel_centroids = sel_centroids
    })
  }

  function hex_map() {
    d3.json("world-110m.json", function (error, world) {
      
      if (error) throw error;

      //Create a land shape | Filter out Antarctica
      var land = topojson.merge(world, world.objects.countries.geometries)  

      // Initialize the context’s path with the desired boundary (nothing is drawn to the screen)
      context.beginPath()
      path(land)

      //Figure out the hexagon grid dimensions
      var SQRT3 = 1.7320508075688772
      var hex_radius = 3
      const hex_width = SQRT3 * hex_radius
      const hex_height = 2 * hex_radius
      const map_columns = Math.ceil(width / hex_width)
      const map_rows = Math.ceil((height - 0.5*hex_radius)/(1.5 * hex_radius))

      //Loop over hexagon grid
      let hex_points = []
      for (let i = 0; i < map_rows; i++) {
        for (let j = 0; j < map_columns; j++) {
          let a
          let b = (3 * i) * hex_radius / 2
          if (i % 2 === 0) a = SQRT3 * j * hex_radius
          else a = SQRT3 * (j - 0.5) * hex_radius
      
          //Check if this point lies within the landmass, if yes, save it
          if (context.isPointInPath(a, b)) hex_points.push({x: a, y: b})

        }
      }
      //console.log(hex_points)

      var svg = modal.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('id', 'hexagon_map')

      const size_increase = 1 //dummy to not have very small white lines between the hexagons
      
      var hexagon_outer_points = [[0, -1], [SQRT3 / 2, -0.5], [SQRT3 / 2, 0.5], [0, 1], [-SQRT3 / 2, 0.5], [-SQRT3 / 2, -0.5], [0, -1]]

      //The "local" SVG path coordinates (happens when you use small case letters; m, l, z)
      const hexagon_path = "m" + hexagon_outer_points
            .map(p => [p[0] * hex_radius*size_increase, p[1] * hex_radius*size_increase].join(','))
            .join('l') + "z"

      var hexagons = svg.append('g')
        .selectAll('path')
        .data(hex_points)
        .enter().append('path')
        .attr('class', 'hexagons')
        .attr("d", d => {
          //Move the path to the center and then draw a "locally" based SVG path 
          return "M" + [d.x, d.y] + hexagon_path
        })
        .style('fill', function (d) {
          var polygon = [[0+d.x, -1+d.y], [SQRT3 / 2+d.x, -0.5+d.y], [SQRT3 / 2+d.x, 0.5+d.y],
                         [0+d.x, 1+d.y], [-SQRT3 / 2+d.x, 0.5+d.y], [-SQRT3 / 2+d.x, -0.5+d.y], [0+d.x, -1+d.y]]
          //console.log(global_sel_centroids)
          //global_sel_centroids.map(function(c) {
            //if (d3.polygonContains(polygon, [0+d.x, -1+d.y])) {
              //return "red"
            //} else {
              return "black"
            //}
          //})
        })
        .attr("stroke", "white")
        .attr("stroke-width", "1px")


      //d3.selectAll('.hexagons')
        //.each(function(d) {
          //var a_hexagon_path = d3.select(this).attr("d")
          //centroids.map(function(c) {
            //if (d3.polygonContains(a_hexagon_path, [c[1],c[2]])) {
              //d3.select(this).style('fill', 'red')
            //}
          //})
        //})
    
    })
  }

}

///////////////////////////////////////////////////////////////////////////
///////////////////////////// Helper functions ////////////////////////////
///////////////////////////////////////////////////////////////////////////
function execute(callback) {
  setTimeout(function() {
    callback();
  },1000);
}