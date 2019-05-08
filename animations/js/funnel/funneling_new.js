var graph = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 

  var canvasDim = { width: 1000, height: 1500}
  var margin = {top: 5, right: 5, bottom: 5, left: 5}
  var width = canvasDim.width - margin.left - margin.right 
  var height = canvasDim.height - margin.top - margin.bottom 
  var modal = d3.select("#chart")

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

      var associationScoreRange = [0, 0.25, 0.5, 0.75]

      // grouping 'Unlawful Money Lending', "Tax & Customs Violation",  "Trafficking in Arms, Ammunition, Stolen Goods", "Violent Crime" into "Others"
      var crime =  ['Money Laundering', 'Unlawful Money Lending', "Cybercrime", "Organised Crime", "Terrorism",  "Sanctions"]
      var nodes = ["0", "0.25", "0.5", "0.75", 'Money Laundering', 'Unlawful Money Lending', "Cybercrime", "Organised Crime"]

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////////////// Generate sankey ////////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      data = {"nodes" : [], "links" : []};

      nodes.forEach(function (d,i) {
        data.nodes.push({"id": d });
       });

      data.links = [
        {"source":"0","target":"Organised Crime","value":1},
        {"source":"0.25","target":"Cybercrime","value":1},
        {"source":"0.5","target":"Unlawful Money Lending","value":1},
        {"source":"0.75","target":"Money Laundering","value":1},              
      ]

      var sankey = d3.sankey()
          .nodeWidth(25)
          .nodePadding(20)
          .nodeId(d => d.id)
          .nodeAlign(d3.sankeyCenter)
          .size([width, height]);

      let graph = sankey(data)

      //associationScoreRange.map(function (a) {
        //graph.links.push({ "source": nodes.indexOf(a),
                           //"target": nodes.indexOf(c),
                           //"value": 5 });
      //})

      // add in the links
      var link = svg.append("g").selectAll(".link")
          .data(graph.links)
        .enter().append("path")
          .attr("class", d=>"link link-" + d.source.node + "-" + d.target.node)
          .attr("d", d3.sankeyLinkHorizontal())
          .style("stroke-width", function(d) { return d.width })
          .style('stroke', 'black')
          .style("fill", "none")

      // add the link titles
      link.append("title")
            .text(function(d) {
            return d.source.name + " → " + d.target.name });

      // add in the nodes
      var node = svg.append("g").selectAll(".node")
          .data(graph.nodes)
        .enter().append("g")
          .attr("class", d=>"node node-" + d.node)
   
    // add in the title for the nodes
      node.append("rect")
        .style("fill", "grey")
        .style("stroke", "grey")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)

      ///////////////////////////////////////////////////////////////////////////
      ////////////////////// Marker moving along path //////////////////////////
      ///////////////////////////////////////////////////////////////////////////

      var paths = assoc_to_crimeG.selectAll('path')

      paths.each(function(d,i){
        let path = d3.select(this)
        console.log(path)
        var startPoint = {x: entryPoints[i].x,  y: entryPoints[i].y}
        console.log(startPoint)
        var marker = svg.append("circle");
        marker.attr("r", 7)
          .attr("transform", "translate(" + startPoint.x +  "," + startPoint.y + ")");

        var interval = d3.interval(function(elapsed) {
          if (elapsed > 16000) {
            interval.stop(); 
            return;
          } else {
            transition()
          }
          
        }, 2000);

        function transition() {
          marker.transition()
              .duration(2000)
              .attrTween("transform", translateAlong(path.node()))
        }
        
        function translateAlong(path) {
          var l = path.getTotalLength();
          return function(i) {
            return function(t) {
              var p = path.getPointAtLength(t * l);
              return "translate(" + p.x + "," + p.y + ")";//Move marker
            }
          }
        }

      })

    }
  }

}()