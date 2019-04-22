///////////////////////////////////////////////////////////////////////////
////////////////////////////// Mouse events ///////////////////////////////
///////////////////////////////////////////////////////////////////////////

function mouseOvered(d, nodes) {

    // stopMouseout = true;
    repeatSearch = true;
    mouseOverDone = true;
    clearTimeout(startSearch);

    if(!clickLocked) {
      clearTimeout(connectionsLooper);
      startSearch = setTimeout(function() { 
        if(repeatSearch) initiateConnectionSearch(d, nodes); 
      }, 500);
    }//if

    //Stop propagation to the SVG
    //d3.event.stopPropagation();
}//mouseOvered

function initiateConnectionSearch(d, nodes) {
    d.id = 153
    //After a each a mouse out may run again
    doMouseOut = true;

    selectedNodes[d.id] = 0;
    selectedNodeIDs = [d.id];
    oldLevelSelectedNodes = [d.id];
    counter = 0    

    findConnections(nodes, selectedNodes, selectedNodeIDs, oldLevelSelectedNodes, counter);

}//initiateConnectionSearch

//Loop once through all newly found relatives to find relatives one step further
function findConnections(nodes, selectedNodes, selectedNodeIDs, oldLevelSelectedNodes, counter) {

  if(counter === 0) {
   hideAllNodes(); 
 }

  showNodes(selectedNodeIDs[0], oldLevelSelectedNodes, selectedNodeIDs, selectedNodes);
  
  if( repeatSearch && counter < 12 ) {
    var levelSelectedNodes = [];
    for(var k = 0; k < oldLevelSelectedNodes.length; k++) {
      //Request all the linked nodes
      var connectedNodes = linkedToID[oldLevelSelectedNodes[k]];
      console.log(connectedNodes)
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

}//findConnections

function hideAllNodes() {
    clearCanvas();

    //Draw the lines
    linkSave.forEach(function(d) {
      ctxLinks.globalAlpha = 0.01;
      ctxLinks.lineWidth = 1;
      ctxLinks.beginPath();
      drawCircleArc(d.center, d.r, d.source, d.target, d.sign);
      ctxLinks.fill();
      ctxLinks.closePath();
    })//forEach

    //Draw the nodes
    nodesSave.forEach(function(d) {
      ctxNodes.globalAlpha = 0.01;
      ctxNodes.fillStyle = "#d4d4d4";
      ctxNodes.shadowBlur = d.group=='Group' ? 30 : 15;
      ctxNodes.shadowColor = "#d4d4d4";
      ctxNodes.beginPath();
      ctxNodes.moveTo(d.x + d.radius, d.y);
      ctxNodes.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
      ctxNodes.fill();
      ctxNodes.closePath();
    });

}//hideAllNodes


//Highlight the found relatives
function showNodes(id, nodeIDs, allNodeIDs, selectedNodes) {

  ctxLinks.save()
  //ctxLinks.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight);
  ctxLinks.translate(transform.x, transform.y);
  ctxLinks.scale(transform.k, transform.k);

  //Draw the more visible lines
  linkSave
    .filter(function(d) { return allNodeIDs.indexOf(d.source.id) > -1 || allNodeIDs.indexOf(d.target.id) > -1; })
    .forEach(function(d) {
      //console.log(d)
      d.hoverMin = 1000;
      var closeSource = selectedNodes[d.source.id],
          closeTarget = selectedNodes[d.target.id];
      if (typeof closeSource !== "undefined" && typeof closeTarget !== "undefined") { d.hoverMin = Math.min(closeSource, closeTarget); }
      ctxLinks.strokeStyle = "#d4d4d4";
      ctxLinks.lineWidth = 2.5; 
      ctxLinks.globalAlpha = 0.3;
      ctxLinks.beginPath();
      drawCircleArc(d.center, d.r, d.source, d.target, d.sign);
      ctxLinks.stroke();
      ctxLinks.closePath();
    })//forEach
  ctxLinks.restore()

  ctxNodes.save()
  //ctxNodes.clearRect(-margin.left - width/2, -margin.top, totalWidth, totalHeight); 
  ctxNodes.translate(transform.x, transform.y);
  ctxNodes.scale(transform.k, transform.k);

  //Draw the more visible nodes
  nodesSave
    .filter(function(d) { return nodeIDs.indexOf(d.id) > -1; })
    .forEach(function(d) {
      //console.log(d)
      d.closeNode = selectedNodes[d.id];

      ctxNodes.globalAlpha = 1;
      ctxNodes.fillStyle = d.group=='Group' ? 'lightyellow' : colorScale(d.group);
      ctxNodes.shadowBlur = d.group=='Group' ? 30 : 15;
      ctxNodes.shadowColor = d.group=='Group' ? 'lightyellow' : colorScale(d.group);

      ctxNodes.beginPath();
      ctxNodes.moveTo(d.x + d.radius, d.y);
      ctxNodes.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
      ctxNodes.fill();
      ctxNodes.closePath();
    });
  ctxNodes.shadowBlur = 0;
  ctxNodes.restore()

}//showNodes

//Go back to the normal state
function mouseOut() {

  //Don't do a mouse out during the search of neighbors
  //if(stopMouseout) return;
  //Don't do a mouseout when a node was clicked
  if(clickLocked) return;

  //Disrupt the mouseover event so no flashing happens
  repeatSearch = false;
  clearTimeout(connectionsLooper);
  clearTimeout(startSearch);

  //Only run the mouse out the first time you really leave a node that you spend a 
  //significant amount of time hovering over
  if(!doMouseOut) return;

  //Redraw the visual
  clearCanvas();
  ctxLinks.strokeStyle = "#d4d4d4";
  ctxLinks.lineWidth = 1.5;
  drawLinks(linkSave);
  drawNodes(nodesSave);

  doMouseOut = false;

}//mouseOut