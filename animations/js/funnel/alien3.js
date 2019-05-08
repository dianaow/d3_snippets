var graph = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var canvasDim = { width: screen.width, height: screen.height}
  var margin = {top: 50, right: 50, bottom: 50, left: 500}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.height - margin.top - margin.bottom 
  var modal = d3.select("#chart")
  var canvas = modal.append('canvas')

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

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////// Generate data //////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      var associationScoreRange = [0, 0.25, 0.5, 0.75]

      var nodes = [
      "Spaceship",
      'Money Laundering', 
      "Tax & Customs Violation",
      "Crime", "Cybercrime", "Organised Crime",  "Terrorism", "Unlawful Money Lending", 
      "Sanctions", "Other Sanctions", "Sectoral Sanctions", "Formerly Sanctioned", "Narrative Sanctions", "Formerly Sanctioned - Iran",
      "Singapore", "Russia", "Japan", "China", "USA"]

      var colorScale = d3.scaleOrdinal()
        .domain(nodes)
        .range(["black",
        "#E47D06",
        "#DB0131",
        "#AF0158", "#bf3379", "#cf669a", "#df99bc", "#efccdd", 
        "#3465A8", '#5c83b9', '#85a2ca', '#adc1dc', '#d6e0ed',
        "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3"])

      graph = {"nodes" : [], "links" : []};

      nodes.forEach(function (d,i) {
        graph.nodes.push({"id": i, "name": d });
       });

      graph.links = [
        {"source":"Spaceship","target":"Money Laundering","value":100}, 
        {"source":"Spaceship","target":"Tax & Customs Violation","value":21},
        {"source":"Spaceship","target":"Crime","value":291},
        {"source":"Spaceship","target":"Sanctions","value":313},
        // middle nodes - crime
        {"source":"Crime","target":"Cybercrime","value":223},
        {"source":"Crime","target":"Organised Crime","value":61},
        {"source":"Crime","target":"Terrorism","value":1},
        {"source":"Crime","target":"Unlawful Money Lending","value":6},
        // middle nodes - sanctions
        {"source":"Sanctions","target":"Other Sanctions","value":267},
        {"source":"Sanctions","target":"Sectoral Sanctions","value":19},
        {"source":"Sanctions","target":"Formerly Sanctioned","value":11},
        {"source":"Sanctions","target":"Narrative Sanctions","value":9},
        {"source":"Sanctions","target":"Formerly Sanctioned - Iran","value":7},
        // to country
        {"source":"Money Laundering","target":"China","value":30},   
        {"source":"Money Laundering","target":"Russia","value":40},
        {"source":"Money Laundering","target":"USA","value":20}, 
        {"source":"Money Laundering","target":"USA","value":10}, 
        {"source":"Tax & Customs Violation","target":"Singapore","value":20},   
        {"source":"Tax & Customs Violation","target":"Japan","value":1},
        {"source":"Unlawful Money Lending","target":"Russia","value":6}, 
        {"source":"Organised Crime","target":"Russia","value":11},  
        {"source":"Organised Crime","target":"Japan","value":50},  
        {"source":"Cybercrime","target":"Singapore","value":20},
        {"source":"Cybercrime","target":"Japan","value":3},   
        {"source":"Cybercrime","target":"Russia","value":200},   
        {"source":"Terrorism","target":"USA","value":1},
        {"source":"Other Sanctions","target":"Russia","value":200}, 
        {"source":"Other Sanctions","target":"China","value":60}, 
        {"source":"Other Sanctions","target":"USA","value":7}, 
        {"source":"Sectoral Sanctions","target":"China","value":19},  
        {"source":"Formerly Sanctioned","target":"China","value":11},
        {"source":"Narrative Sanctions","target":"China","value":9},
        {"source":"Formerly Sanctioned","target":"China","value":7}                 
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
      //////////////////////////////// Initialize Sankey ////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      var sankey = d3.sankey()
            .nodeWidth(10)
            .nodePadding(10)
            .size([600, 800]);

      var path = sankey.link()

      sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(10);

      // append a defs (for definition) element to your SVG
      const defs = svg.append('defs');

      sankey  
        .nodes(graph.nodes, d=>d.node)
        .links(graph.links,d=>"link link-" + d.source.name + "-" + d.target.name)
        .layout(1);

      // add in the links
      var link = svg.append("g").selectAll(".link")
          .data(graph.links)
          .enter().append("path")
          .attr("class", "link")
          .attr("d", path)
          .style("fill", "none")
          .style("stroke-width", function (d) {
            return d.dy;
          })
          .style("stroke-opacity", 1)
         .sort(function (a, b) {
              return b.dy - a.dy;
          });

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

      ///////////////////////////////////////////////////////////////////////////
      //////////////////////// Manually customize node position /////////////////
      ///////////////////////////////////////////////////////////////////////////

      function manualLayout() {
        //http://stackoverflow.com/questions/10337640/how-to-access-the-dom-element-that-correlates-to-a-d3-svg-object
        //displacements in order of foo nodes (foo[0][j])
        var displacementsX = [0, 0, 0, 0, 0, 0, 0, 0, 0, -300, -100, 0, 100, 20];
        var displacementsY = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        var foo = d3.selectAll("g.node");
        console.log(foo.nodes())
        for (j=9; j < displacementsX.length; j++) {
          console.log(displacementsX[j])
          pickNode = foo.nodes()[j]; //equals "this" in d3.behavior.drag()...on("dragstart")
          d = graph.nodes[j];

          d3.select(pickNode).attr("transform", 
                "translate(" + (
                       d.x = d.x + displacementsX[j]
              ) + "," + (
                       d.y = d.y + displacementsY[j] //Math.max(0, Math.min(height - d.dy, d3.event.y))
                ) + ")");
       
        }
        sankey.relayout();
        link.attr("d", path);
      }

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////////// Render nodes ///////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      // add in the nodes
      var node = svg.append("g").selectAll(".node")
          .data(graph.nodes)
          .enter().append("g")
          .attr("class", "node")
          .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")" })
          .call(function () {
            manualLayout();
          });

      // add the circles for the nodes
      node.append("circle")
          .attr("cy", function (d) {
              return d.name == 'Spaceship' ? sankey.nodeWidth()/2-100 : sankey.nodeWidth()/2;
          })
          .attr("cx", function (d) {
              return d.dy/2;
          })
          .attr("r", function (d) {
              return d.name == 'Spaceship' ? 200 : d.dy/2;
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

      var freqCounter = 1;
      var linkExtent = d3.extent(graph.links, function (d) {return d.value});
      var frequencyScale = d3.scaleLinear().domain(linkExtent).range([1,100]);
      var particleSize = d3.scaleLinear().domain(linkExtent).range([1,5]);

      graph.links.forEach(function (link) {
        link.freq = frequencyScale(link.value);
        link.particleSize = particleSize(link.value);
        link.particleColor = d3.scaleLinear().domain([1,1000]).range([link.source.color, link.target.color]);
      })
      console.log(graph.links)
      var t = d3.timer(tick, 1000);
      var particles = [];

      function tick(elapsed, time) {

        particles = particles.filter(function (d) {return d.time > (elapsed - 1000)});

        if (freqCounter > 100) {
          freqCounter = 1;
        }

        d3.selectAll("path.link")
        .each(
          function (d) {
            if (d.freq >= freqCounter) {
              var offset = (Math.random() - .5) * d.dy;
              particles.push({link: d, time: elapsed, offset: offset, path: this})
            }
          });

        particleEdgeCanvasPath(elapsed);
        freqCounter++;

      }
      
      function particleEdgeCanvasPath(elapsed) {

        var context = canvas.node().getContext('2d');

        context.clearRect(0,0,1000,1000);

          context.fillStyle = "gray";
          context.lineWidth = "1px";
        for (var x in particles) {
            var currentTime = elapsed - particles[x].time;
            var currentPercent = currentTime / 1000 * particles[x].path.getTotalLength();
            var currentPos = particles[x].path.getPointAtLength(currentPercent)
            context.beginPath();
          context.fillStyle = particles[x].link.particleColor(currentTime);
            context.arc(currentPos.x,currentPos.y + particles[x].offset,particles[x].link.particleSize,0,2*Math.PI);
            context.fill();
        }
      }


    }
  }

}()