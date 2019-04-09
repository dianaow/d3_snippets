function marginConvention(selection, props) {
  const {
    width,
    height,
    margin,
    className = 'margin-group'
  } = props;
  
  let g = selection
    .selectAll('.' + className).data([null]);
  g = g
    .enter().append('g')
      .attr('class', className)
    .merge(g)
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  return { g, innerWidth, innerHeight };
}