function colorLegend (selection, props) {
  const {
    colorScale,
    circleRadius,
    spacing,
    textOffset,
    textSize,
    type
  } = props;

  const groups = selection.selectAll('g')
    .data(colorScale.domain());

  const groupsEnter = groups
    .enter().append('g')
      .attr('class', 'tick');

  groupsEnter
    .merge(groups)
      .attr('transform', (d, i) => {
          if(type=='vertical'){
            return `translate(0, ${i * spacing})`
          } else if(type=='horizontal') {
            return `translate(${i * spacing}, 0)`
          }
        }
      );
  groups.exit().remove();

  groupsEnter.append('circle')
    .merge(groups.select('circle'))
      .attr('r', circleRadius)
      .attr('fill', colorScale);

  groupsEnter.append('text')
    .merge(groups.select('text'))
      .text(d => d)
      .attr('dy', '0.32em')
      .attr('x', textOffset)
      .attr('font-size', textSize)
}