const colorScale = d3.scaleOrdinal()
  .domain(['apple', 'lemon'])
  .range(['#c11d1d', '#eae600']);

const radiusScale = d3.scaleOrdinal()
  .domain(['apple', 'lemon'])
  .range([80, 50]);

const fruitBowl = (selection, props) => {
  const { fruits, height } = props; // destructure
  const bowl = selection.selectAll('rect')
    .data([null])
    .enter().append('rect')
      .attr('y', 110)
      .attr('width', 920)
      .attr('height', 300)
      .attr('rx', 300 / 2);
  
  // .selectAll(): an empty selection because there are no groups when this line of code is invoked
  // .data(): create a D3 data join 
  // have to call selectAll first so that D3 data join knows what elements are already present in the DOM
  // the D3 data join is now fully capable of figuring out how many elements are in each of the three different selections (enter/update/exit)
  // store data join in a variable to reuse it
  const groups = selection.selectAll('g').data(fruits); 

  // 'enter' takes into effect for all data points because there is no corresponding DOM elements initially
  // enter(): computes the enter selection. finds data that don't have any corresponding elements
  // append(): circle elements to be appended for every one of the data elements
  const groupsEnter = groups.enter().append('g');
    //.attr(...); if function is invoked again with new data, this will not set new attributes/styles to existing elements, reason being attribute is being set on the enter selection

  // to modify attributes, need to declare attributes in the update selection, not enter selection, becuase update selection contains data points with existing elements
  // As the D3 data join itself is the update selection, we can set new attributes/styles to elements with this line
  //groups.attr(...) 

  groupsEnter
    .merge(groups) // modify the existing and entering elements
      .attr('transform', (d, i) =>
        `translate(${i * 180 + 100},${height / 2})` 
      ); // any attributes declared after 'merge' will be set on existing and entering elements

  // exit(): computes the exit selection. finds elements that don't have any corresponding data
  // groups.exit().style(...) will style these elements differently
  // remove(): removes element from DOM
  groups.exit().remove();
  
  groupsEnter.append('circle') // nest circles within groups by accessing groups enter selection
    .attr('r', 0)
    .merge(groups.select('circle')) // select children (the circle) of the group elements
      .transition().duration(1000)
      .attr('r', d => radiusScale(d.type))
      .attr('fill', d => colorScale(d.type));
  
  groupsEnter.append('text')
    .merge(groups.select('text'))
      .text(d => d.type)
      .attr('y', 120); // move 120px down with respect to the parent
}


class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.renderFruits = this.renderFruits.bind(this);
  }

  componentDidMount() {
    this.container = d3.select(this.refs.container);

    var fruits = this.props.fruits 

    this.renderFruits(fruits);

    // Eat an apple.
    setTimeout(() => {
      fruits.pop(); // remove the last data point from array
      this.renderFruits(fruits);
    }, 1000);

    // Replace an apple with a lemon.
    setTimeout(() => {
      fruits[2].type = 'lemon';
      this.renderFruits(fruits);
    }, 2000);

    // Eat an apple (second one from the left).
    setTimeout(() => {
      fruits = fruits.filter((d, i) => i !== 1);
      this.renderFruits(fruits);
    }, 3000);

  }

  renderFruits(fruits) {
    fruitBowl(this.container, {
      fruits,
      height: +this.container.attr('height')
    });
  };

  render() {
    return (
      <svg width="960" height="500" ref='container' />
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.updateData = this.updateData.bind(this)
    this.state = {fruits: []}
  }

  componentWillMount() {
    this.updateData()
  }

  updateData() {
    // Buy 5 apples.
    const makeFruit = type => ({ type });
    const fruits = d3.range(5).map(() => makeFruit('apple'));
    this.setState({fruits})
  }

  render() {
    return (
      <div>
        <Graph {...this.state} />
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
)