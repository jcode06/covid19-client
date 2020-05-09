<script>
import { onMount, onDestroy } from 'svelte';
import legend from 'd3-svg-legend';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

window.d3 = d3;
window.legend = legend;

/*
data should be a Map of key value pairs, e.g. { 'California' => 12345 }
*/
export let dataset = new Map();

let usData;
let svg;

$: { 
    if(dataset instanceof Map && dataset.color && dataset.values) {
        update(usData, dataset);
    }
};

const update = (usMapData, data) => {
    if(!svg || !usMapData || usMapData.length || 
        !data || !data.values || data.length <= 0) { 
//        console.error('Data may not be available', svg, usMapData, data);
        return; 
    }

    let values = Array.from(data.values() );
    let min = d3.min(values) > 0 ? d3.min(values) : 1;
    let max = d3.max(values);

    let colorScheme = d3.schemeBlues[9];
    switch(data.color) {
        case 'blue': colorScheme = d3.schemeBlues[9]; break;
        case 'green': colorScheme = d3.schemeGreens[9]; break;
        case 'grey': colorScheme = d3.schemeGreys[9]; break;
        case 'orange': colorScheme = d3.schemeOranges[9]; break;
        case 'purple': colorScheme = d3.schemePurples[9]; break;
        case 'red': colorScheme = d3.schemeReds[9]; break;
    }

    let color = d3.scaleQuantize([min, max], colorScheme);

window.d3 = d3;
window.color = color;

    // let color = d3.scaleLog()
    // let color = d3.scaleLinear()
    //     .domain([min, max])
    //    .range(['#f0f6ff', '#0062ff']);
    //     .range(['#fff5ed', '#ab4700']);

    svg.selectAll('path').remove();
    svg.selectAll('g').remove();

    let path = d3.geoPath();

    svg.append('path')
        .datum(topojson.mesh(usMapData, usMapData.objects.states, (a, b) => a !== b))
        .attr('fill', 'none')
        .attr('stroke', '#000')
        .attr("stroke-linejoin", "round")
        .attr('stroke-width', 2)
        .attr('d', path);

    svg.append('g')
        .selectAll('path')
        .data(topojson.feature(usMapData, usMapData.objects.states).features )
        .join('path')
            .attr("fill", d => color(data.get(d.properties.name)))
            .attr('stroke', '#999')
            .attr("stroke-linejoin", "round")
            .attr('stroke-width', 1)
            .attr('d', path);

    let labels = [min, '', '', '', Math.round(max / 2), '', '', '', max];
    let colorLegend = legend.legendColor()
        .labelFormat(d3.format(".0f"))
        .shapeWidth(30)
        .orient('horizontal')
        .scale(color)
        .labels(labels)
        .shapeHeight(20)
        .labelOffset(12);

    svg.append("g")
        .attr("transform", "translate(352, 10)")
        .call(colorLegend);            
};

const handlerOnMount = async () => {

    try {
        usData = await d3.json("maps/counties-albers-10m.json");

        let container = document.querySelector('.map-container');

        let graphWidth = 975, 
            graphHeight = 610;

        d3.selectAll('.map-container *').remove();

        svg = d3.select('.map-container')
            .append('svg')
            .attr('class', 'svg-content')
            .style('width', '100%')
            .style('height', '100%')
            .attr('viewBox', `0 0 ${graphWidth} ${graphHeight}`);

        update(usData, dataset);
    }
    catch(e) {
        console.error('[Map] Error fetching map data', e);
    }
};
const handlerOnDestroy = () => {};

onMount(handlerOnMount);
onDestroy(handlerOnDestroy);

</script>

<style type="text/scss">
    .map-container { 

        position: sticky;
        top: 0;
        z-index: 1000;
        background-color: #e9e9e9;
        width: 100%;
        height: 30vh;
        
        overflow: hidden; 
    }

    .svg-content { 
        width: 100%;
        height: 100%;
    }        

    @media (min-width: 640px) {
        .map-container {
            position: relative;
            height: initial;
        }
    }
</style>

<div class="map-container"></div>