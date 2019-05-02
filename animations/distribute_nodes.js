var distribute = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var simulation, circles, g
  var canvasDim = { width: screen.width*0.9, height: screen.height*0.8}
  var margin = {top: 20, right: 20, bottom: 20, left: 20}
  var width = canvasDim.width - margin.left - margin.right;
  var height = canvasDim.height - margin.top - margin.bottom;
  var crime = ["Money Laundering", "Sanctioned transaction", "Terrorist financing"]
  var modal = d3.select(".modal-content5")

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var color = ['#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000']
  var category = ["1", "2", "3", "4", "5", "6", "7"]
  var colorScale = d3.scaleOrdinal()
    .domain(category)
    .range(color)

  var radiusScale = d3.scaleLinear()
  .domain(d3.range(1,5))
  .range(d3.range(3, 15, 3))

  var xScale = d3.scaleLinear()
    .range([0, width])

  var yScale = d3.scaleLinear()
    .range([0, height*(1/2)])

  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// CORE //////////////////////////////////
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

      g = svg.append("g")
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      ////////////////////////// Run animation sequence /////////////////////////
      var nodes = getData()
      var distributed = distributedData(nodes) // run this function first to get IDs of nodes
      var scattered = scatteredData(distributed) // modify x-y coordinates only
      
      distributed.forEach((d,i) => {
        d.length = getPathLength(scattered, d)
      })
      console.log(distributed)
      update(scattered, 'scattered')
      scatter(scattered)

      execute(function() {
        cluster()
        execute(function() {
          simulation.stop()
          update(distributed, 'distributed')
        })
      })
 
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////// Find length of trajectory ///////////////////////
  ///////////////////////////////////////////////////////////////////////////
  function getPathLength(other, d) {
    var d2 = other.find(b=>b.id==d.id)
    var len = Math.sqrt((Math.pow(d.x-d2.x,2))+(Math.pow(d.y-d2.y,2)))
    return len
  } 

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////// Data Processing //////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function getData() {

    var nodes = []
    d3.range(1,4).map((d,i) => {
      nodes.push({'band': "8"})
    })
    d3.range(1,201).map((d,i) => {
      var rand = Math.round(randn_bm(1, 8, 1))
      nodes.push({
        'band': rand
      })
    })

    return nodes
  }

  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////////// Scatter plot /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function scatteredData(data) {

    // modify x-y coordinates of nodes to form a scattered distribution
    var nodes = data.map(function(d, i) {
      return {
          id: d.id,
          x: xScale(+Math.random()),
          y: yScale(+Math.random()),
          color: d.color,
          radius: d.radius
      }
    })

    let xMax = d3.max(nodes, d=> +d.x) * 1.1
    let xMin = d3.min(nodes, d=> + d.x) - xMax/15
    let yMax = d3.max(nodes, d=> +d.y) * 1.1
    let yMin = d3.min(nodes, d=> + d.y) - yMax/15

    xScale.domain([xMin, xMax])
    yScale.domain([yMin, yMax])

    return nodes

  } 

  function scatter(data) {
    
    simulation = d3.forceSimulation(data, d=>d.id)
      .alpha(.02)
      .force('charge', d3.forceManyBody().strength(-30))
        .force("x", d3.forceX(function (d) { return d.x }))
        .force("y", d3.forceY(function (d) { return d.y }))
        .force("collide", d3.forceCollide(function(d,i) { return d.radius + 5}))


    simulation.on('tick', ticked);

    function ticked() {
      circles
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
    }

  }

  function cluster() {

    simulation.stop();

    simulation
      .force('charge', d3.forceManyBody().strength(-30))
      .force('x', d3.forceX(width/2))
      .force('y', d3.forceY(height/2))
      .force("collide", d3.forceCollide(function(d,i) { return d.radius + 5}))
      
    simulation.alpha(0.5);

    simulation.restart();

  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Distribution plot ///////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function distributedData(nodes) {

    var tilesPerRow = 10
    var tileSize = 22
    var barWidth = 220

    // find count of nodes within each category 
    var counts = nodes.reduce((p, c) => {
      var name = c.band; // key property
      if (!p.hasOwnProperty(name)) {
        p[name] = 0;
      }
      p[name]++;
      return p;
    }, {});

    countsExtended = Object.keys(counts).map(k => {
      var circles_arr = nodes.filter(d=>d.band==k)
      return {name: k, count: counts[k]}; circles_arr:  circles_arr});

    // get x-y coordinates of all tiles first without rendering the dotted bar chart
    var dataAll = countsExtended.map(d=>d.count)
    var arrays = []
    dataAll.map((d,i) => {
      var tiles = getTiles(d, i)
      arrays.push(tiles)
    })
    var distributed = [].concat.apply([], arrays)

    return distributed

    // This will render the dotted bar chart by calculating the x-y coordinates for each 'band' of the bar chart on render
    //var u = g.selectAll("g").data(countsExtended.map(d=>d.count))

    //u.enter()
      //.append("g")
      //.merge(u)
      //.each(updateBar)

    //function updateBar(num, i) {
      //var tiles = getTiles(num, i)
      //var u = d3.select(this)
        //.attr("transform", "translate(" + i * barWidth + ", 500)")
        //.selectAll("rect")
        //.data(tiles);
   
       //u.enter()
        //.append("circle")
        //.attr("class", d=>d.id)
        //.style("stroke", "white")
        //.style("stroke-width", "1")
        //.style("shape-rendering", "crispEdges")
        //.merge(u)
        //.attr('fill', d=>d.color)
        //.attr("cx", function(d) {
          //return d.x;
        //})
        //.attr("cy", function(d) {
          //return d.y;
        //})
        //.attr("r", tileSize/2)
       
      //u.exit().remove();
    //}

    function getTiles(num, counter) {
      var tiles = [];
      for(var i = 0; i < num; i++) {
        var rowNumber = Math.floor(i / tilesPerRow)
        tiles.push({
          x: ((i % tilesPerRow) * tileSize) + (counter * barWidth) + tileSize,
          y: -(rowNumber + 1) * tileSize + height, 
          color: color[counter],
          id: counter + '-' + i, // index each node
          radius: tileSize/2
        });
      }
      return tiles
    }

  }


  ///////////////////////////////////////////////////////////////////////////
  //////////////////////////// Updated node positions ///////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function update(data, type) {
    console.log(data)
    circles = g.selectAll('circle').data(data, d=>d.id)
    
    var entered_circles = circles
      .enter()
      .append('circle')
        .style('opacity', 1)
        .attr('id', d => d.id)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .style('fill', d => d.color)
        .attr('r', d => d.radius)

    circles = circles.merge(entered_circles)

    if(type=='scattered'){  

      var t = d3.transition()
      circles.transition(t)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

    } else if(type=='distributed'){

      var t = d3.transition()
        .duration(2100)
        .ease(d3.easeQuadOut)
        
      // transition each node one by one within each group at the same time
      category.map((d,i)=> {
        circles.filter("circle[id^='" + i.toString() + "']")
          .transition(t)
          //.delay(function(d,i){ return 100*i }) // transition each node one by one based on index
          .delay(function(d,i){ return d.length*10 }) // transition each node one by one based on length of trajectory
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
      })
      
    }

  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Helper functions ////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  function randn_bm(min, max, skew) {
      var u = 0, v = 0;
      while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
      while(v === 0) v = Math.random();
      let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

      num = num / 10.0 + 0.5; // Translate to 0 -> 1
      if (num > 1 || num < 0) num = randn_bm(min, max, skew); // resample between 0 and 1 if out of range
      num = Math.pow(num, skew); // Skew
      num *= max - min; // Stretch to fill range
      num += min; // offset to min
      return num;
  }

  function getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min)
  }

  function execute(callback) {
    setTimeout(function() {
      callback();
    }, 3000);
  }

}()