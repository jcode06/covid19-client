<script>
import { onMount, onDestroy } from 'svelte';
import * as d3 from 'd3';

/*
data should be an Object with the following structure:
{ 
    xData: [list of x axis data],
    yData: [two dimensional list of y data]
    labels: { x: 'x label', y: ['list of 1 or more y labels']},
    min: { x: x min, y: y min of all y values },
    max: { x: x max, y: y max of all y values }
}
 of key value pairs, e.g. { 'California' => 12345 }
*/
export let dataset = {};

// Just update the graph whenever the dataset may change
$: {
    if(dataset && dataset.xData && dataset.yData) {
        console.log('[LineChart.svelte - mutate] updating...', dataset);
        run();
    }
}

const run = () => {

    const container = document.querySelector('.svg-container');

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };

    const width = container.clientWidth,
        height = container.clientHeight;

    const xScale = d3.scaleUtc()
        .domain([dataset.min.x, dataset.max.x])
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([dataset.min.y, dataset.max.y])
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .defined(d => !isNaN(d))
        .x( (d, i) => xScale(dataset.xData[i]) )
        .y(d => yScale(d) );

    const xAxis = g => g
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(width / 80).tickSizeOuter(0) );

    const yAxis = g => g
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale));

    const svg = d3.select('.svg-container svg')
        .attr('viewBox', [0, 0, width, height])

    svg.selectAll('g').remove();

    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);

    const path = svg.append('g')
            .attr('fill', 'none')
            // .attr('stroke', 'green')
            .attr('stroke-width', 1.5)
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')
        .selectAll('path')
        // .data(yData)
        .data(dataset.yData)
        .join('path')    
            .attr('d', d => line(d) )
            .attr('stroke', (d, i) => dataset.colors[i] );
};

window.run = run;

const handlerOnMount = async () => {
    window.addEventListener('resize', handlerResize, {passive: true});
    console.log('[LineChart.svelte - handlerOnMount] finished...');
};

let timeout;
const handlerResize = () => {

    if( !(dataset && dataset.xData && dataset.yData) ) { return; }

    if(timeout) { clearTimeout(timeout); }
    timeout = setTimeout( () => { run(); }, 500);

    console.log('[LineChart.svelte - handlerResize] resizing...');
};


const handlerOnDestroy = () => {};

onMount(handlerOnMount);
onDestroy(handlerOnDestroy);

</script>

<style type="text/scss">
    .svg-container { 
        width: 100%;
        height: 30vh;
        
        .svg-content { 
            display: inline-block;
            width: 100%;
            height: 100%;
        }        
    }

    @media (min-width: 640px) {
        .svg-container {
            height: 80vh;
            position: relative;
        }
    }
</style>

<div class="svg-container"><svg class="svg-content"></svg></div>