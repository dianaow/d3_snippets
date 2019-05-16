var hexmap = function hexmap() {

  //________________________________________________
  // GET/SET defaults
  //________________________________________________

  // private variables
  var svg = undefined;

  // getter setter defaults
  var opts = {
      width: 960,
      height: 600,
      margin: { top: 20, right: 10, bottom: 20, left: 10 }
  };

  var countries = ['Singapore', 'Japan', "Mexico"]
  var hexbin = d3.hexbin().size([opts.width, opts.height]).radius(5);
  var modal = d3.select('#vis')
  //________________________________________________
  // RENDER
  //________________________________________________

  var canvas = modal.append('canvas').attr('width', opts.width).attr('height', opts.height).attr('id', 'mapCanvas');

  var context = canvas.node().getContext('2d');
  var points = [];
  var hexagons = [];

  context.fillStyle = 'tomato';
  context.strokeStyle = 'none';

  var projection = d3
     .geoEquirectangular()
     .center([0, 0]) // set centre to further North
     .scale([opts.width/5]) // scale to fit group width
     .translate([opts.width/2,opts.height/2]) // ensure centred in group

  var path = d3.geoPath(projection, context);

  d3.json("world-110m.json", function (error, world) {
      if (error) throw error;

      path(topojson.feature(world, world.objects.land));
      context.fill();

      // use the canvas as the image
      var image = document.getElementById('mapCanvas');

      context.drawImage(image, 0, 0, opts.width, opts.height);
      image = context.getImageData(0, 0, opts.width, opts.height);

      for (var c, i = 0, n = opts.width * opts.height * 4, d = image.data; i < n; i += 4) {
          points.push([i / 4 % opts.width, Math.floor(i / 4 / opts.width), d[i]]);
      }

      hexagons = hexbin(points);

      var svg = modal.append('svg').attr('width', opts.width).attr('height', opts.height);

      var hexagon = svg.append('g')
      .attr('class', 'hexagons')
      .selectAll('path')
      .data(hexagons)
      .enter().append('path')
      .attr('d', hexbin.hexagon(4.5)).attr('transform', function (d) {
          return 'translate(' + d.x + ',' + d.y + ')';
      })
      .style('fill', function (d) {
          return "black"
      })
      .attr("stroke", "white")
			.attr("stroke-width", "1px")

  });

}