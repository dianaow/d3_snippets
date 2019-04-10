function init() {

  d3.queue()   
    .defer(d3.csv, 'https://raw.githubusercontent.com/dianaow/dianaow.github.io/master/forcelayout/data/nodes_filt_entity.csv')
    .defer(d3.csv, 'https://raw.githubusercontent.com/dianaow/dianaow.github.io/master/forcelayout/data/nodes_officer_sea.csv')
    .defer(d3.csv, 'https://raw.githubusercontent.com/dianaow/dianaow.github.io/master/forcelayout/data/nodes_edges_sea.csv')  
    .await(transformData);  

}

function transformData(error, entity, officer, edges) {
	
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

	//var data = {}
	//data.nodes = []
	//data.relationships = []

  //officer_new.map((d,i) => {
  	//var tmp = {'id': d.node_id, 'labels': ['Officer'], 'properties': {'name': d.name, 'country': d.countries}}
  	//data.nodes.push(tmp) 
  //})

  //entity_new.map((d,i) => {
  	//var tmp = {'id': d.node_id, 'labels': ['Entity'], 'properties': {'name': d.name, 'country': d.countries, 'incorporation_date': d.incorporation_date}}
  	//data.nodes.push(tmp) 
  //})

  //edges_new.map((d,i) => {
  	//var tmp = {
  		//'id': i, 
  		//'type': d.type, 
  		//'startNode': d.start_id, 
  		//'endNode': d.end_id,
  		//'source': d.start_id,
  		//'target': d.end_id,
  		//"linknum": i,
  		//'properties': {'link': d.link, 'start_date': d.start_date, 'end_date': d.end_date}}
  	//data.relationships.push(tmp) 
  //})
  //console.log(data)


  var data = {"results": [{"columns": ["Officer", "Entity"], "data": [{"graph" : {"nodes": [], "relationships": []}}]}], "error": []}

  officer_new.map((d,i) => {
  	var tmp = {'id': d.node_id, 'labels': ['Officer'], 'properties': {'name': d.name, 'country': d.countries}}
  	data.results[0].data[0].graph.nodes.push(tmp) 
  })

  entity_new.map((d,i) => {
  	var tmp = {'id': d.node_id, 'labels': ['Entity'], 'properties': {'name': d.name, 'country': d.countries, 'incorporation_date': d.incorporation_date}}
  	data.results[0].data[0].graph.nodes.push(tmp) 
  })


  // filter edges based on avilable officer and entity nodes
  edges_matched.map((d,i)=> {
    var tmp = {
      'id': i, 
      'type': d.type, 
      'startNode': d.start_id, 
      'endNode': d.end_id,
      'source': d.start_id,
      'target': d.end_id,
      "linknum": i,
      'properties': {'link': d.link, 'start_date': d.start_date, 'end_date': d.end_date}
    }
    data.results[0].data[0].graph.relationships.push(tmp)
  })

  console.log(data)

  render(data)
}


function render(data) {
	var neo4jd3 = new Neo4jd3('#neo4jd3', {
	    highlight: [
	        {
	            class: 'Entity',
	            property: 'name',
	            value: 'PACIFIC CREDIT LIMITED'
	        }, {
	            class: 'Officer',
	            property: 'name',
	            value: 'Budhrani - Vandana'
	        }
	    ],
      icons: {
        'Officer': 'user-secret',
        'Entity': ''
      },
	    minCollision: 60,
	    neo4jData: data,
	    nodeRadius: 25,
	    zoomFit: false
	});
}

window.onload = init;