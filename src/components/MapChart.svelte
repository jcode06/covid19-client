<script>
import { createEventDispatcher, onMount, onDestroy } from 'svelte';
import legend from 'd3-svg-legend';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

window.d3 = d3;

/*
data should be a Map of key value pairs, e.g. { 'California' => 12345 }
*/
export let dataset = new Map();

const dispatch = createEventDispatcher();

let usData;
let svg;
let zoom;

let graphWidth, 
    graphHeight,
    viewportWidth,
    viewportHeight;

$: { 
    if(dataset instanceof Map && dataset.color && dataset.values) {
        update(usData, dataset);
    }
};

const computeDims = () => {
    return {
        width: document.querySelector('.map-container') != undefined ? 
    document.querySelector('.map-container').getBoundingClientRect().width : window.innerWidth,
            height: document.querySelector('.map-container') != undefined ? 
    document.querySelector('.map-container').getBoundingClientRect().height : 300
    };
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

    // let color = d3.scaleQuantize([min, max], colorScheme);


    const interpolator = d3.piecewise(d3.interpolateHsl, 
        ["white",data.color]
    );
    let color = d3.scaleSequential([min, max], interpolator );

    // let color = d3.scaleLog()
    // let color = d3.scaleLinear()
    //     .domain([min, max])
    //    .range(['#f0f6ff', '#0062ff']);
    //     .range(['#fff5ed', '#ab4700']);

    svg.selectAll('path').remove();
    svg.selectAll('g').remove();

    // Define zoom behavior for the graph
    zoom = d3.zoom()
        .scaleExtent([0.5, 5]) // zoom from 1x(original) to 5x
        .translateExtent([[0-viewportWidth * .25, 0-viewportHeight * .25], [viewportWidth * 1.25, viewportHeight * 1.25]] )
        .on('zoom', function() {
            svg.selectAll('path')
                .attr('transform', d3.event.transform);
        } );

    svg.call(zoom);

    let path = d3.geoPath();

    // destroy any old event listeners before attaching new ones
    svg.selectAll('path')
        .on('click', null)
        .on('mousemove', null)
        .on('mouseout', null);


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
            .attr('class', 'state')
            .attr("fill", d => color(data.get(d.properties.name)))
            .attr('stroke', '#999')
            .attr("stroke-linejoin", "round")
            .attr('stroke-width', 1)
            .attr('d', path)
            .on('click', handlerClick )
            .on('mousemove', handlerMouseover(data) )
            .on('mouseout', handlerMouseout );

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

        viewportWidth = 975, 
        viewportHeight = 610;

        svg = d3.select('.map-container svg')
            .attr('class', 'svg-content')
            .style('width', '100%')
            .style('height', '100%')
            .attr('viewBox', `0 0 ${viewportWidth} ${viewportHeight}`);
        
        update(usData, dataset);
    }
    catch(e) {
        console.error('[MapChart] Error fetching map data', e);
    }
};
const handlerOnDestroy = () => {
    if(svg == undefined) { return; }
    console.log('[MapChart onDestroy] called');

    svg.selectAll('path')
        .on('click', null)
        .on('mousemove', null)
        .on('mouseout', null);
};

window.handlerOnDestroy = handlerOnDestroy;

const handlerClick = function(e) {
    dispatch('mapClick', { name: e.properties.name });
};

const handlerMouseenter = function(e) { 
    dispatch('mapMouseenter', e);
};  
const handlerMouseover = data => function(e) { 
    this.style.cursor = 'pointer';

    let [x, y] = d3.mouse(svg.node()).map(d => parseInt(d) );
    let { width, height } = document.querySelector('.map-container svg').getBoundingClientRect();

    // Take proportional measurements based on the values provided to the svg's viewBox attribute
    let xProportion = x / viewportWidth;
    let yProportion = y / viewportHeight;

    x = xProportion * width;
    y = yProportion * height;

    dispatch('mapMouseover', { 
        x, y,
        width, height,
        name: e.properties.name, value: data.get(e.properties.name)
    }); 
};  
const handlerMouseout = function(e) {     
    this.style.cursor = 'default';
    dispatch('mapMouseout', e);
};  

const handlerTouchstart = function(e) { dispatch('mapTouchstart', e) };  
const handlerTouchmove = function(e) { dispatch('mapTouchmove', e) };  
const handlerTouchend = function(e) { 


    dispatch('mapTouchend', e) 
};

// let timeout;
// const handlerResize = () => {
//     if(timeout) { clearTimeout(timeout); }
//     timeout = setTimeout( () => { 
//         let dims = computeDims();
//         graphWidth = dims.width;
//         graphHeight = dims.height;
//     }, 500);
// };


onMount(handlerOnMount);
onDestroy(handlerOnDestroy);

</script>

<style type="text/scss">
    .map-container { 

        position: sticky;
        top: 0;
        z-index: 5;
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

<!-- <svelte:window on:resize={handlerResize} /> -->

<div class="map-container">
    <svg></svg>
    <slot></slot>
</div>