<script>
import { onMount, onDestroy } from 'svelte';
import * as d3 from 'd3';

export let dataset = [];

$: {
    console.log('reactive Chart', dataset);
    if(dataset && dataset.length > 0) {
        update();
    }
}

const margin = { top: 40, right: 20, bottom: 50, left: 50 };
const graphWidth = 560 - margin.left - margin.right;
const graphHeight = 400 - margin.top - margin.bottom;

let svg, graph,
    xScale, yScale,
    xAxisGroup, yAxisGroup,
    posLine, posPath,
    deathLine, deathPath;

const handlerOnMount = () => {
    svg = d3.select('.canvas')
        .append('svg')
        .attr('width', graphWidth + margin.left + margin.right)
        .attr('height', graphHeight + margin.top + margin.bottom);

    graph = svg.append('g')
        .attr('width', graphWidth)
        .attr('height', graphHeight)
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    xScale = d3.scaleTime().range([0, graphWidth]);
    yScale = d3.scaleLinear().range([graphHeight, 0]);

    xAxisGroup = graph.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${graphHeight})`);

    yAxisGroup = graph.append('g')
        .attr('class', 'y-axis');

    // line for total positives
    posLine = d3.line()
        .x( d => xScale(new Date(d.date)) )
        .y( d => yScale(d.positive));

    deathLine = d3.line()
        .x( d => xScale(new Date(d.date)) )
        .y( d => yScale(d.death));

    posPath = graph.append('path');
    deathPath = graph.append('path');

    console.log('mounted');
};

const update = () => {
    console.log('Chart', dataset);

window.d3 = d3;

    xScale.domain(d3.extent(dataset, d => new Date(d.date) ));
    yScale.domain([0, d3.max(dataset, d => d.positive)]);

    posPath.data([dataset])
        .attr('fill', 'none')
        .attr('stroke', 'green')
        .attr('stroke-width', 2)
        .attr('d', posLine);

    deathPath.data([dataset])
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('d', deathLine);

    const xAxis = d3.axisBottom(xScale)
        .ticks(4)
        .tickFormat(d3.timeFormat('%b %d') );
    const yAxis = d3.axisLeft(yScale)
        .ticks(8)
        .tickFormat( d => d );

    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);

    xAxisGroup.selectAll('text')
        .attr('transform', 'rotate(-40)')
        .attr('text-anchor', 'end');
};

const handlerOnDestroy = () => {};

onMount(handlerOnMount);
onDestroy(handlerOnDestroy);

</script>

<style>

</style>

<div class="canvas"></div>