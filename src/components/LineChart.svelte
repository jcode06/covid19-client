<script>
import { onMount, onDestroy } from 'svelte';
import * as d3 from 'd3';

export let dataset = [];
let aspectRatio = 1/1; // default to 16:9 widescreen format

// Just update the graph whenever the dataset may change
$: {
    if(dataset && dataset.length > 0) {
        console.log('[LineChart.svelte - mutate] updating...');
        update();
    }
}

let margin;
let graphWidth;
let graphHeight;

// components of the graph
let container,
    svg, graph,
    xScale, yScale,
    xAxisGroup, yAxisGroup,
    posLine, posPath,
    deathLine, deathPath;

const initialize = () => {

    // create references to the different DOM elements
    container = document.querySelector('.svg-container');

    // Initialize canvas and graph
    svg = d3.select('.svg-container')
        .append('svg')
        .attr('class', 'svg-content')
        .attr('preserveAspectRatio', 'xMinYMin meet');

    graph = svg.append('g');

    xAxisGroup = graph.append('g').attr('class', 'x-axis');
    yAxisGroup = graph.append('g').attr('class', 'y-axis');

    posPath = graph.append('path');
    deathPath = graph.append('path');
};

const setSizesAndScales = () => {
    // set the sizes and scales for different elements
    // can be rerun on page resize
    aspectRatio = (document.body.clientWidth <= 640) ? 16/9 : 1/1;

    let width = container.clientWidth;
    let height = (document.body.clientWidth <= 640) ? width / aspectRatio : container.clientHeight;

    margin = { top: 40, right: 20, bottom: 50, left: 50 };
    graphWidth = width - margin.left - margin.right;
    graphHeight = height - margin.top - margin.bottom;

    // Initialize canvas & group dimensions
    svg 
        .attr('width', graphWidth + margin.left + margin.right)
        .attr('height', graphHeight + margin.top + margin.bottom)
        .attr('viewBox', `0 0 ${graphWidth + margin.left + margin.right} ${graphHeight + margin.top + margin.bottom}`);

    graph
        .attr('width', graphWidth)
        .attr('height', graphHeight)
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    xScale = d3.scaleTime().range([0, graphWidth]);
    yScale = d3.scaleLinear().range([graphHeight, 0]);

    xAxisGroup
        .attr('transform', `translate(0, ${graphHeight})`);

    // line for total positives
    posLine = d3.line()
        .x( d => xScale(new Date(d.date)) )
        .y( d => yScale(d.positive));

    deathLine = d3.line()
        .x( d => xScale(new Date(d.date)) )
        .y( d => yScale(d.death));
};

const handlerOnMount = async () => {
    initialize();
    setSizesAndScales();

    console.log('[LineChart.svelte - handlerOnMount] finished...');
};

const handlerResize = () => {
    setSizesAndScales();
    update();

    console.log('[LineChart.svelte - handlerResize] resizing...');
};

const update = () => {
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
        .ticks(4)
        .tickFormat( d => d );

    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);

    xAxisGroup.selectAll('text')
        .attr('transform', 'rotate(-40)')
        .attr('text-anchor', 'end');

   window.addEventListener('resize', handlerResize);
};

const handlerOnDestroy = () => {};

onMount(handlerOnMount);
onDestroy(handlerOnDestroy);

</script>

<style type="text/scss">
    .svg-container { 
        display: flex;
        align-items: center; 

        position: sticky;
        top: 0;
        z-index: 1000;
        width: 100%;
        min-width: 240px;
        min-height: 240px;
        
        margin: 0 auto;
        vertical-align: middle; 
        overflow: hidden; 
        background-color: #eee;

        .svg-content { 
            display: inline-block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }        
    }

    @media (min-width: 640px) {
        .svg-container {
            position: relative;
        }
    }
</style>

<div class="svg-container"></div>