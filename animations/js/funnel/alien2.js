var graph = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var canvasDim = { width: 1250, height: screen.height}
  var margin = {top: 50, right: 50, bottom: 50, left: 500}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.height - margin.top - margin.bottom 
  var modal = d3.select("#chart")
  var canvas = modal.append('canvas').attr('class', 'canvas')
  var context = canvas.node().getContext('2d')

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Initialize //////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  return { 
    clear : function () {
      modal.select("svg").remove()
    },
    run : function () {

      //////////////////// Set up and initiate containers ///////////////////////
      var svg = modal.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      countriesGroup = svg
       .append("g")
       .attr("id", "map")

      var sf = Math.min(2, getPixelRatio(context)) //no more than 2
      if(screen.width < 500) sf = 1 //for small devices, 1 is enough

      canvas
        .attr('width', sf * canvasDim.width)
        .attr('height', sf * canvasDim.height)
        .style('width', canvasDim.width + "px")
        .style('height', canvasDim.height + "px")

      context.scale(sf,sf);
      context.translate(margin.left, margin.top);

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////// Generate data //////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      var associationScoreRange = [0, 0.25, 0.5, 0.75]

      var nodes = [
      "Spaceship", "Unlawful Money Lending", "Cybercrime", "Organised Crime",  "Terrorism", 'Money Laundering',  
      "Sanctions", "Sanctions 1", "Sanctions 2",
      "Mexico", "China", "Japan", "Singapore", "Russia", 'Italy', "Canada"]

      var colorScale = d3.scaleOrdinal()
        .domain(nodes)
        .range(["black","#E47D06", "#DB0131", "#AF0158", "#7F378D", "#3465A8",
        "#0AA174","#6cc6ab", "#ceece3",
        "slategrey", "slategrey", "slategrey", "slategrey", "slategrey", "slategrey", "slategrey"])
        //"#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3"])

      graph = {"nodes" : [], "links" : []};

      nodes.forEach(function (d,i) {
        graph.nodes.push({"id": i, "name": d });
       });

      graph.links = [
        {"source":"Spaceship","target":"Money Laundering","value":10}, 
        {"source":"Spaceship","target":"Unlawful Money Lending","value":10},
        {"source":"Spaceship","target":"Cybercrime","value":10},
        {"source":"Spaceship","target":"Organised Crime","value":10},
        {"source":"Spaceship","target":"Terrorism","value":10},
        {"source":"Spaceship","target":"Sanctions","value":10},
        {"source":"Sanctions","target":"Sanctions 1","value":8},
        {"source":"Sanctions","target":"Sanctions 2","value":2},
        {"source":"Money Laundering","target":"China","value":3},   
        {"source":"Money Laundering","target":"Russia","value":3},
        {"source":"Money Laundering","target":"Mexico","value":4},   
        {"source":"Unlawful Money Lending","target":"Russia","value":10}, 
        {"source":"Organised Crime","target":"Japan","value":10},  
        {"source":"Cybercrime","target":"Singapore","value":10},   
        {"source":"Terrorism","target":"Mexico","value":10},
        {"source":"Sanctions 1","target":"Russia","value":4},  
        {"source":"Sanctions 1","target":"Italy","value":4},  
        {"source":"Sanctions 2","target":"China","value":2}                     
      ]

      var nodeMap = {};
      graph.nodes.forEach(function(x) { nodeMap[x.name] = x; });
      graph.links = graph.links.map(function(x) {
        return {
          source: nodeMap[x.source],
          target: nodeMap[x.target],
          value: x.value
        };
      });

      //associationScoreRange.map(function (a) {
        //graph.links.push({ "source": nodes.indexOf(a),
                           //"target": nodes.indexOf(c),
                           //"value": 5 });
      //})

      ///////////////////////////////////////////////////////////////////////////
      /////////////////////////// Initialize Sankey /////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      var sankey = d3.sankey()
            .nodeWidth(10)
            .nodePadding(10)
            .size([350, 650]);

      var curve = sankey.link()

      sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(12);

      drawMap()
      //execute(function() {
        //drawSankey()
      //})

      ///////////////////////////////////////////////////////////////////////////
      //////////////////////// Render links (with gradient) /////////////////////
      ///////////////////////////////////////////////////////////////////////////

      // append a defs (for definition) element to your SVG
      const defs = svg.append('defs');

      sankey  
        .nodes(graph.nodes, d=>d.node)
        .links(graph.links, d=>"link link-" + d.source.name + "-" + d.target.name)
        .layout(13);

      // add in the links
      var link = svg.append("g").selectAll(".link")
          .data(graph.links)
          .enter().append("path")
          .attr("class", "link")
          .attr("d", curve)
          .style("fill", "none")
          .style("stroke-width", function (d) {
            return d.dy;
          })
          .style("stroke-opacity", 1)
          .sort(function (a, b) {
              return b.dy - a.dy;
          })
          .style("stroke", "black")
      createGradient()
      function createGradient() {
        link.style("stroke", function(d,i) {
              // make unique gradient ids  
              const gradientID = `gradient${i}`;

              const startColor = colorScale(d.source.name);
              const stopColor = colorScale(d.target.name);

              const linearGradient = defs.append('linearGradient')
                  .attr('id', gradientID)
                  .attr("gradientTransform", "rotate(90)");

              linearGradient.selectAll('stop') 
                .data([                             
                    {offset: '50%', color: startColor },      
                    {offset: '75%', color: stopColor }    
                  ])                  
                .enter().append('stop')
                .attr('offset', d => {
                  return d.offset; 
                })   
                .attr('stop-color', d => {
                  return d.color;
                });

              return `url(#${gradientID})`;

        })
      }

      ///////////////////////////////////////////////////////////////////////////
      //////////////////////////////// Render map ///////////////////////////////
      ///////////////////////////////////////////////////////////////////////////
      var sel_centroids = []
      var filteredCountries = ["Mexico", "China", "Japan", "Singapore", "Russia", 'Italy', "Canada"]

      // Define map projection
      var projection = d3
         .geoEquirectangular()
         .center([0, -15]) // set centre to further North
         .scale([width/2]) // scale to fit group width
         .translate([0,height]) // ensure centred in group

      // Define map path
      var path = d3.geoPath()
         .projection(projection)
      
      function drawMap() {
        // get map data
        d3.json(
          "https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json",
          function(json) {

            // add a background rectangle
            countriesGroup
               .append("rect")
               .attr("x", 0)
               .attr("y", 0)
               .attr("width", width)
               .attr("height", height)

            // draw a path for each feature/country
            countries = countriesGroup
               .selectAll("path")
               .data(json.features)
               .enter()
               .append("path")
               .attr("d", path)
               .attr("id", function(d, i) {
                  return "country" + d.properties.name;
               })
               .attr("class", "country")

            var centroids = []
            json.features.map(d=> {
              centroids.push([d.properties.name, path.centroid(d)[0], path.centroid(d)[1]])
            })
            sel_centroids = centroids.filter(function(d){ return filteredCountries.indexOf(d[0]) != -1 })
            console.log(sel_centroids)

            countryLabels = countriesGroup
               .selectAll("g")
               .data(json.features)
               //.filter(function(d) { return filteredCountries.indexOf(d.properties.name) != -1 })
               .enter()
               .append("g")
               .attr("class", "countryLabel")
               .attr("id", function(d) {
                  return "countryLabel" + d.properties.name;
               })
               .attr("transform", function(d) {
                  return (
                     "translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")" // centroid of countries
                  );
               })
          
          }
        )
      }

      ///////////////////////////////////////////////////////////////////////////
      //////////////////////// Manually customize node position /////////////////
      ///////////////////////////////////////////////////////////////////////////

      function manualLayout() {
        //http://stackoverflow.com/questions/10337640/how-to-access-the-dom-element-that-correlates-to-a-d3-svg-object
        //displacements in order of foo nodes (foo[0][j])
        sel_centroids = [["China", 634.194630559586, 635.0270986503383], 
        ["Japan", 843.1827606083929, 628.7319117178528],
        ["Singapore", 634.1835276619687, 850.0700164287862],
        ["Russia", 590.624592166605, 479.7527504395012],
        ["Mexico", -626.2801271358472, 712.0830341822129],
        ["Italy", 73.73151618184028, 596.9405003263257],
        ["Canada", -600.5279945467455, 483.5307006702942]
        ]

        for (j=0; j < sel_centroids.length; j++) {
          //pickNode = foo.nodes()[j]; // do not select node based on index
          pickNode = d3.select('.node-' + sel_centroids[j][0]) // select the node based on class name
          d = graph.nodes.find(function(d) {  return d.name == sel_centroids[j][0] }); // get the properties of that node
          pickNode.attr("transform", 
                "translate(" + (
                       d.x = sel_centroids[j][1]
              ) + "," + (
                       d.y = sel_centroids[j][2] //Math.max(0, Math.min(height - d.dy, d3.event.y))
                ) + ")");
       
        }

        categories =[["Sanctions", 20, 0], ["Sanctions", 20, 0], ["Sanctions", 20, 0]]

        for (j=0; j < categories.length; j++) {
          //pickNode = foo.nodes()[j]; // do not select node based on index
          pickCircle = d3.select('.circle-' + categories[j][0])
          pickNode = d3.select('.node-' + categories[j][0]) // select the node based on class name
          d = graph.nodes.find(function(d) {  return d.name == categories[j][0] }); // get the properties of that node
          pickNode.attr("transform", 
                "translate(" + (
                       d.x = d.x + categories[j][1]
              ) + "," + (
                       d.y = d.y + categories[j][2] //Math.max(0, Math.min(height - d.dy, d3.event.y))
                ) + ")");

        }


        sankey.relayout();
        link.attr("d", curve);
      }

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////////// Render nodes ///////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      // add in the nodes
      var node = svg.append("g").selectAll(".node")
          .data(graph.nodes)
          .enter().append("g")
          .attr("class", function(d) { return "node node-" + d.name })
          .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")" })
          .call(function () {
           manualLayout();
          });

      // add the circles for the nodes
      node.append("circle")
          .attr("class", function(d) { return "circle-" + d.name })
          .attr("cy", function (d) {
              return d.name == 'Spaceship' ? sankey.nodeWidth()/2-200 : sankey.nodeWidth()/2;
          })
          .attr("cx", function (d) {
              return d.dy/2;
          })
          .attr("r", function (d) {
              return d.name == 'Spaceship' ? 300 : d.dy/2;
          })
          .style("fill", function (d) {
              return colorScale(d.name)
          })
          .style("fill-opacity", 1)
          .style("shape-rendering", "crispEdges")
          .append("title")
          .text(function (d) {
              return d.name + "\n" + d.value
          });


      // add in the title for the nodes
      node.append("text")
          .attr("y", function (d) {
              return - 6 + sankey.nodeWidth() / 2 - Math.sqrt(d.dy);
          })
          .attr("x", function (d) {
              return d.dy / 2;
          })
          .attr("dy", ".35em")
          .attr("text-anchor", "end")
          .attr("text-shadow", "0 1px 0 #fff")
          .attr("transform", null)
          .text(function (d) {
              return d.name;
          })
          .filter(function (d) {
              return d.x < width / 2;
          })
          .attr("x", function (d) {
              return 6 + sankey.nodeWidth() / 2 + Math.sqrt(d.dy);
          })
          .attr("text-anchor", "start");


      ///////////////////////////////////////////////////////////////////////////
      ////////////////////// Marker moving along path ///////////////////////////
      ///////////////////////////////////////////////////////////////////////////
      trickling()

      function trickling() {
        var FREQ = 1000
        var SPEED = 10000

        var freqCounter = 1;
        var linkExtent = d3.extent(graph.links, function (d) {return d.value});
        var frequencyScale = d3.scaleLinear().domain(linkExtent).range([1,FREQ]);
        var particleSize = d3.scaleLinear().domain(linkExtent).range([0.2,2]);

        graph.links.forEach(function (link) {
          link.freq = frequencyScale(link.value);
          link.particleSize = particleSize(link.value);
          link.particleColor = d3.scaleLinear().domain([1,SPEED]).range([colorScale(link.source.name), colorScale(link.target.name)]); // don't transition color of nodes
        })

        var t = d3.timer(tick, SPEED);
        var particles = [];

        function tick(elapsed, time) {

          particles = particles.filter(function (d) {return d.time > (elapsed - SPEED)});
          if (freqCounter > FREQ) {
            freqCounter = 1;
          }

          d3.selectAll("path.link")
          .each(
            function (d) {
              if (d.freq >= freqCounter) {
                var offsetX = (Math.random() - .2) * sankey.nodeWidth();
                var offsetY = (Math.random() - .5) * d.dy;
                particles.push({link: d, time: elapsed, offsetX: offsetX, offsetY: offsetY, path: this})
              }
            });

          particleEdgeCanvasPath(elapsed);
          freqCounter++;

        }
        
        function particleEdgeCanvasPath(elapsed) {

          context.clearRect(-margin.left, -margin.top, canvasDim.width, canvasDim.height);

          context.fillStyle = "grey";
          context.lineWidth = "1px";

          for (var x in particles) {
              var currentTime = elapsed - particles[x].time;
              var currentPercent = currentTime / SPEED * particles[x].path.getTotalLength();
              var currentPos = particles[x].path.getPointAtLength(currentPercent)
              context.beginPath();
              //context.fillStyle = particles[x].link.particleColor(currentTime);
              context.arc(currentPos.x+ particles[x].offsetX, currentPos.y + particles[x].offsetY, particles[x].link.particleSize, 0, 2*Math.PI);
              context.fill();
          }
        }

      }

    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Helper functions ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  function execute(callback) {
    setTimeout(function() {
      callback();
    }, 1000);
  }

  function getTextBox(selection) {
    selection.each(function(d) {
      d.bbox = this.getBBox();
    });
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
  }

}()