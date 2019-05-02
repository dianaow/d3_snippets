var distribute = function () {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Globals /////////////////////////////////
  /////////////////////////////////////////////////////////////////////////// 
  var simulation, circles, g, pathG,  circleG, groupIDs
  var canvasDim = { width: screen.width*0.9, height: screen.height*0.8}
  var margin = {top: 20, right: 20, bottom: 20, left: 20}
  var width = canvasDim.width - margin.left - margin.right;
  var height = canvasDim.height - margin.top - margin.bottom;
  var modal = d3.select(".modal-content5")
  var links_filt = []

  var linkedByIndex = {},
      linkedToID = {},
      nodeByID = {}
  var counter = 0
  var connectionsLooper

  // set node, link and text colors
  var nodeFillColor = '#DCDCDC'
  var nodeStrokeColor = 'navy'
  var nodeText = 'navy'
  var linkStrokeColor = '#212121'

  // set node, link and text dimenstions
  var nodeRadius = 4
  var nodeStrokeWidth = 1
  var linkStrokeWidth = 1

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Create scales ///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var colorTopNodes = d3.scaleOrdinal()
    .range(["#EFB605", "#E47D06", "#DB0131", "#AF0158", "#7F378D", "#3465A8", "#0AA174", "#7EB852"])

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

      pathG = g.append("g")
        .attr("class", "pathG")

      circleG = g.append("g")
        .attr("class", "circleG")

      pathGHull = g.append("g")
        .attr("class", "pathGHull")

      ////////////////////////// Run animation sequence /////////////////////////
      getData()

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
  ///////////////////// Data Processing - Panama Papers /////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function getData() {

    d3.queue()   
      .defer(d3.csv, 'nodes_filt_entity.csv')  
      .defer(d3.csv, 'nodes_officer_sea.csv')
      .defer(d3.csv, 'nodes_edges_sea.csv')
      .await(initialize);  

  }

  function initialize(error, entity, officer, edges){

    var parseDate = d3.timeParse("%d-%b-%Y")

    entity_new = entity.map((d,i) => {
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

    edges_new = edges.map((d,i) => {
      return {
        start_id: +d.START_ID,
        end_id: +d.END_ID,
        type: d.TYPE,
        link: d.link,
        start_date: d.start_date ? parseDate(d.start_date) : "",
        end_date: d.end_date ? parseDate(d.end_date) : ""
      }
    })
    
    officer_new = officer_new.filter(d=>d.countries=='Singapore' & d.node_id > 80040000)

    // match start point of an edge to an officer
    data = edges_new.map((d,i) => {
      return Object.assign({}, d, officer_new.find(b=>b.node_id===d.start_id) ||{});
    })

    // data cleaning: since entities that lack a corresponding officer name or date, remove them
    data = data.filter(d=> (d.start_date != null) & ( d.start_date != ""))
    data = data.filter(d=> (d.name != undefined) & (d.name != null))

    // data cleaning: remove duplicate start and end node_ids
    data = data.filter((thing, index, self) =>
      index === self.findIndex((t) => (
        t.start_id === thing.start_id && t.end_id === thing.end_id
      ))
    )

    data.forEach((d,i) => {
      var e = entity_new.find(b=>b.node_id == d.end_id) // match end point of an edge to an entity
      // var o = officer_new.find(b=>b.node_id == d.end_id) // there is no officer linked to another officer
      d.end_name = e ? e.name : ""
    })

    var links = data
    var nodes = []

    // this way ensures that there wont by any 'flying' nodes (nodes not attached to any other nodes) 
    data.forEach((d,i) => {
      nodes.push({
        id : d.start_id 
      })
      nodes.push({
        id : d.end_id 
      })
    })

    // remove duplicate entity ids
    nodes = nodes.filter((node, index, self) =>
      index === self.findIndex((t) => (
        t.id === node.id
      ))
    )

    links.forEach((d,i) => {
      d.id = i
      d.source = d.start_id 
      d.target = d.end_id
      d.strokeColor = linkStrokeColor
      d.strokeWidth = linkStrokeWidth

      linkedByIndex[d.source + "," + d.target] = true;

      if(!linkedToID[d.source]) linkedToID[d.source] = [];
      if(!linkedToID[d.target]) linkedToID[d.target] = [];
      linkedToID[d.source].push(d.target); 
      linkedToID[d.target].push(d.source); 
    })

    nodes.forEach((d,i) => {
      d.radius = nodeRadius
      d.color = nodeFillColor
      d.strokeColor = nodeStrokeColor
      d.strokeWidth = nodeStrokeWidth

      nodeByID[d.id] = d
    })
    //console.log(nodes, links)

    ///////////////////////////////////////////////////////////////////////////
    /////////// Organize a network made of disconnected pieces ////////////////
    ///////////////////////////////////////////////////////////////////////////

    // find networks with the top ranked number of connected nodes
    var top = 8
    var links_nested = d3.nest()
      .key(d=>d.source)
      .rollup(function(leaves) { return leaves.length; })
      .entries(links)

    links_nested = links_nested.sort(function(a,b) { return d3.descending(a.value, b.value) })
    for(var i = 0; i < top; i++) {
      links_filt.push(links_nested[i])
    }
    groupIDs = links_filt.map(d=>d.key) // list of ids of the top 9 connected nodes

    //Specify module position for the three largest modules. This is the x-y center of the modules
    //singletons and small modules will be handled as a whole
    var modulePosition = []
    var modsPerRow = 3
    var modsSize = width/3
    for(var i = 0; i < top; i++) {
      var rowNumber = Math.floor(i / modsPerRow)
      var mod = links_filt[i].key 
      modulePosition.push(
      { 
        "group": mod,
        "coordinates" : { 
          x: ((i % modsPerRow) * modsSize) + modsSize,
          y: -(rowNumber + 1) * modsSize + height
        }
      })
    }

    ///////////////////////////////////////////////////////////////////////////
    ///////////////// Find web of grouped nodes within network ////////////////
    ///////////////////////////////////////////////////////////////////////////

    // overwrite color of nodes (which could be either a source or target) based on connection to any of the top 8
    colorTopNodes.domain(groupIDs)
      
    // callback to ensure connection search completes before rendering force layout
    function findAllConnections() {
      groupIDs.map(d=>{
        initiateConnectionSearch(d, nodes)
      })
    }

    function initiateConnectionSearch(d, nodes) {

      var selectedNodes = {},
          selectedNodeIDs = [],
          oldLevelSelectedNodes

      selectedNodes[d] = 0;
      selectedNodeIDs = [d];
      oldLevelSelectedNodes = [d];
      counter = 0    

      return findConnections(nodes, selectedNodes, selectedNodeIDs, oldLevelSelectedNodes, counter);
      
    }

    function findConnections(nodes, selectedNodes, selectedNodeIDs, oldLevelSelectedNodes, counter) {
      //console.log(selectedNodeIDs)
      // with each iteration, nodes that are now connected because of this hop may have its colour overwritten
      // to get a sense of the connectivity, store linked group labels 
      nodes
        .filter(function(d) { return selectedNodeIDs.indexOf(d.id) > -1 })
        .forEach((d,i) => {
          d[selectedNodeIDs[0]] = colorTopNodes(selectedNodeIDs[0])
        })

      if( counter == 7 ) {
        nodes
          .filter(function(d) { return selectedNodeIDs.indexOf(d.id) > -1 })
          .forEach((d,i) => {
            d.group = selectedNodeIDs[0] // final belonged group based on number of hops
            d.color_new = colorTopNodes(selectedNodeIDs[0]) // final color based on number of hops
          })

        links
          .filter(function(d) { return selectedNodeIDs.indexOf(d.start_id) > -1 || selectedNodeIDs.indexOf(d.end_id) > -1 })
          .forEach((d,i) => {
            d.group = selectedNodeIDs[0] // final belonged group based on number of hops
          })
      }

      if( counter < 8 ) {
        var levelSelectedNodes = [];
        for(var k = 0; k < oldLevelSelectedNodes.length; k++) {
          //Request all the linked nodes
          var connectedNodes = linkedToID[oldLevelSelectedNodes[k]];
 
          //Take out all nodes already in the data
          connectedNodes = connectedNodes.filter(function(n) {
            return selectedNodeIDs.indexOf(n) === -1
          });
          //Place the left nodes in the data
          for(var l = 0; l < connectedNodes.length; l++) {
            var id = connectedNodes[l];
            selectedNodes[id] = counter+1;
            selectedNodeIDs.push(id);
            levelSelectedNodes.push(id);
          }//for l
        }//for k

        //Small timeout to leave room for a mouseout to run
        counter += 1;

        oldLevelSelectedNodes = uniq(levelSelectedNodes);
        connectionsLooper = setTimeout(function() { findConnections(nodes, selectedNodes, selectedNodeIDs, oldLevelSelectedNodes, counter); }, 100);
      } 
      

    }

    ///////////////////////////////////////////////////////////////////////////
    /////////// Initialize force simulation and set its params ////////////////
    ///////////////////////////////////////////////////////////////////////////
    function runSimulation() {

      //Make the x-position equal to the x-position specified in the module positioning object or, if module not labeled, set it to center
      var forceX = d3.forceX(function (d) { 
        var group = modulePosition.find(g=>g.group = d.id)
        return group ? group.coordinates.x : width/2
      }).strength(0.2)

      //Same for forceY--these act as a gravity parameter so the different strength determines how closely
      //the individual nodes are pulled to the center of their module position
      var forceY = d3.forceY(function (d) {
        var group = modulePosition.find(g=>g.group = d.id)
        return group ? group.coordinates.y : height/2
      }).strength(0.2)

      // repel disconnected nodes further away from grouped (highly connected) nodes
      nodes.forEach((d,i) => {
        d.color_new = d
        d.group = d.group ? d.group : 'disconnected'
      })
      links.forEach((d,i) => {
        d.group = d.group ? d.group : 'disconnected'
      })
      var charge = d3.forceManyBody(function (d) { return d.group == 'disconnected' ? -20 : -100})

      var buffer = 0

      simulation = d3.forceSimulation()
        .force("link", d3.forceLink()
          .id(function(d) { return d.id; })
          .strength(function(d) {return 0.7})
        )
        .force('center', d3.forceCenter(width/2, height/2))
        .force('charge', charge)
        .force("x", forceX)
        .force("y", forceY)
      //.stop()

      simulation
        .nodes(nodes)
        .on("tick", update) // start simulation to update node positions

      simulation.force("link")
        .links(links)

      //for (var i = 0; i < 200; ++i) simulation.tick()
      //simulation.alpha(1).alphaDecay(0.1).restart()
      enter(nodes, links)

    }
    
    ///////////////////////////////////////////////////////////////////////////
    //////////////////////////// Graph Network plot ///////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    //////////////////////// Create node and link elements ////////////////////
    function enter(nodes, links) {

      path = pathG.selectAll('line')
        .data(links).enter().append('line')
        .attr('stroke-linecap', 'round')

      circle = circleG.selectAll('circle')
        .data(nodes)
        .enter().append('circle')
        .attr('stroke-width', d=>d.strokeWidth) 

    }

    //////////////////////// Update node and link positions ///////////////////
    function update() {

      path.attr('stroke-width', function(d) {return d.strokeWidth})
        .attr('stroke', function(d) {return d.strokeColor})
        .attr('fill', function(d) {return d.strokeColor})
        .attr('x1', function(d) {return d.source.x})
        .attr('y1', function(d) {return d.source.y})
        .attr('x2', function(d) {return d.target.x})
        .attr('y2', function(d) {return d.target.y})
        .attr('class',function(d) {return 'nucleus-' + d.group})
        .attr('id', function(d) {return d.id})

      circle.attr('r', function(d) {return d.radius})
        .attr('stroke-width', function(d) {return d.strokeWidth})
        .attr('stroke', function(d) {return d.strokeColor})
        .attr('fill', function(d) {return d.color_new ? d.color_new : d.color})
        .attr('class',function(d) {return 'nucleus-' + d.group})
        .attr('id', function(d) {return groupIDs.indexOf(d.group) + "-" + d.id}) 

      circle.attr("transform", function(d) { 
        return "translate(" + d.x + "," + d.y + ")"; })
    }

    //////////////////////// Fling nodes away /////////////////////////////
    function fling() {

      simulation.stop()

      var forceX = d3.forceX(function (d) { return width/2 }).strength(0.1)
      var forceY = d3.forceY(function (d) { return height/2 }).strength(0.1)

      simulation
        .force('charge', d3.forceManyBody(function (d) { return d.group == 'disconnected' ? -2000 : -20}))
        .force("x", forceX)
        .force("y", forceY)

      simulation.alpha(1).restart()

    }

    //////////////////////// Remove disconnected nodes and links /////////////////////////////
    function focus() {

      simulation.stop()

      nodes = nodes.filter(d=>d.group != 'disconnected')
      links = links.filter(d=>d.group != 'disconnected')
      //console.log(nodes, links)

      path = path.data(links, d=>d.id)
  
      path.exit().remove();
      
      path = path.enter().append("path").merge(path)

      circle = circle.data(nodes, d=>d.id)
      
      circle.exit().remove();
      
      circle = circle.enter().append("circle").merge(circle)

      var forceX = d3.forceX(function (d) { 
        var group = modulePosition.find(g=>g.group = d.id)
        console.log(group.coordinates.x)
        return group ? group.coordinates.x : width/2
      }).strength(0.1)

      var forceY = d3.forceY(function (d) {
        var group = modulePosition.find(g=>g.group = d.id)
        return group ? group.coordinates.y : height/2
      }).strength(0.1)

      simulation
        .force("link", d3.forceLink().strength(function(d) {return 0.7}))
        .force("x", forceX)
        .force("y", forceY)

      simulation.nodes(nodes).on("tick", update)
      simulation.force('link').links(links)
      simulation.alpha(0.5).restart()

      setTimeout(hideLinks(), 2000)

      function hideLinks() {
        path.transition().duration(1000).attr('opacity', 0)
      }

    }

    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////// Run in sequence /////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    findAllConnections() 
    var distributed = distributedData(nodes)
    console.log(distributed)

    execute(function() {
      runSimulation()
      execute(function() {
        fling()
        //createConvexHullLayer(nodes, groupIDs)
        execute(function() {
          focus()
          execute(function() {
            distributedUpdate(distributed) 
          })
        })
      })
    })


  }
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Distribution plot ///////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function distributedData(nodes) {

    var tilesPerRow = 10
    var tileSize = nodeRadius
    var barWidth = 220

    // get x-y coordinates of all tiles first without rendering the dotted bar chart
    //var dataAll = links_filt.map(d=>d.count)
    var arrays = []
    //dataAll.map((d,i) => {
      //var tiles = getTiles(d, i)
      //arrays.push(tiles)
    //})

    for (var key in links_filt) {
      var tiles = getTiles(links_filt[key].value, links_filt[key].key, key)
      arrays.push(tiles)
    }

    var distributed = [].concat.apply([], arrays)
    console.log(distributed)
    return distributed

    function getTiles(num, group, counter) {
      var tiles = [];
      for(var i = 0; i < num; i++) {
        var rowNumber = Math.floor(i / tilesPerRow)
        tiles.push({
          x: ((i % tilesPerRow) * tileSize) + (counter * barWidth) + tileSize,
          y: -(rowNumber + 1) * tileSize + height, 
          color: colorTopNodes(group),
          class: 'nucleus-' + group, 
          id: counter + '-' + i + num, // index each node (NOTE: this is has to be the same index as force layout's nodes)
          radius: tileSize
        });
      }
      return tiles
    }
  }


  ///////////////////////////////////////////////////////////////////////////
  ///////////////// Update node positions to new layout /////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function distributedUpdate(data) {

    circle = circle.selectAll('circle').data(data, d=>d.id)
    
    circle.exit().remove();
      
    circle = circle.merge(circle)

    var t = d3.transition()
      .duration(2100)
      .ease(d3.easeQuadOut)
      
    // transition each node one by one within each group at the same time
    groupIDs.map((d,i)=> {
      console.log(circle.filter("circle[class*='" + i.toString() + "']"))
      circle.filter("circle[class*='" + i.toString() + "']")
        .transition(t)
        .delay(function(d,i){ return 10*i }) // transition each node one by one based on index
        //.delay(function(d,i){ return d.length }) // transition each node one by one based on length of trajectory
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
    })

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

  function uniq(a) {
      return a.sort().filter(function(item, pos, ary) {
          return !pos || item != ary[pos - 1];
      })
  }//uniq

  function execute(callback) {
    setTimeout(function() {
      callback();
    }, 3000);
  }

}()