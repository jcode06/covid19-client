<script>
import { onMount, onDestroy } from 'svelte';
import * as d3 from 'd3';

export let dataset = {
    xData: [],
    barData: [],
    labels: { x: '', y: [] }, 
    min: { x: null, y: null },
    max: { x: null, y: null }
};

let container;
let svg;
let xScale;
let yScale;
let line;
let chartWidth = window.innerWidth;
let chartHeight = 300;
let margin = { top: 30, right: 20, bottom: 30, left: 60 };

window.d3 = d3;


$: xMin = dataset.min.x > 0 ? dataset.min.x : 0;
$: xMax = dataset.max.x > 0 ? dataset.max.x : 0;
$: yMin = dataset.min.y > 0 ? dataset.min.y : 0;
$: yMax = dataset.max.y > 0 ? dataset.max.y : 0;

$: {
    xScale = d3.scaleUtc()
        .domain([xMin, xMax])
        .range([margin.left, chartWidth - margin.right ]);
}

$: { 
    yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([chartHeight - margin.top, 5 + margin.bottom]);
}

$: {
    line = d3.line()
        // .defined(d => !isNaN(d))
        .x( (d, i) => xScale(dataset.xData[i]) )
        .y(d => yScale(d) );
}

$: update({
    xData: dataset.xData,
    barData: dataset.barData,
    barColor: dataset.barColor,
    lineData: dataset.lineData,
    lineColor: dataset.lineColor,
    width: chartWidth,
    height: chartHeight
});


const computeDims = () => {
    return {
        width: document.querySelector('.svg-container') != undefined ? 
    document.querySelector('.svg-container').getBoundingClientRect().width : window.innerWidth,
            height: document.querySelector('.svg-container') != undefined ? 
    document.querySelector('.svg-container').getBoundingClientRect().height : 300
    };
};

const update = params => {
    let { xData, barData, lineData, barColor, lineColor, width, height } = params;

    if(xData == undefined || barData == undefined) {
        console.error('[BarLineChart.run] No data specified', xData, barData);
        return;
    }

    container = d3.select('.svg-container');
    svg = container.select('svg');

    // Just clear the axes every time we update
    svg.selectAll('g.axis').remove();

    const t = svg.transition().duration(750);

    svg.select('g.chart')
        .selectAll('rect')
        .data(barData)
        .join(enter => {
                enter.append('rect') 
                    .attr('x', (d, i) => xScale( xData[i] ) )
                    .attr('y', d => yScale(0) )
                    .attr('width', (width / xData.length - 1) - 0.2 )
                    .attr('height', (d, i) => 0 )                  
                    .call(enter => enter.transition(t) 
                        .attr('fill', barColor)
                        .attr('y', d => yScale(d) )
                        .attr('height', (d, i) => yScale(0) - yScale(d) )
                    );
            },
            update => { 
                update
                    .attr('x', (d, i) => xScale( xData[i] ) )
                    .attr('y', d => yScale(0) )
                    .attr('width', (width / xData.length - 1) - 0.2 )
                    .attr('height', (d, i) => 0 )                  
                    .call(update => update.transition(t) 
                        .attr('fill', barColor)
                        .attr('y', d => yScale(d) )
                        .attr('height', (d, i) => yScale(0) - yScale(d) )
                    );
            },
            exit => { 
               exit.remove()
            }
        );  

    svg.selectAll('g.lineMovingAvg path').remove();

    svg.select('g.lineMovingAvg')
        .append('path')
            // .style('display', 'none')
            .attr('fill','none')
            .attr('stroke-width', 3)
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')
//            .attr('stroke', lineColor )
        .datum(lineData)
        .join('path')
            .attr('d', d => line(0) )
            .transition(t)
                .attr('d', d => line(d) )
                .attr('stroke', lineColor );


    // svg.select('g')
    //     .select('path')
    //     .datum(lineData)
    //     .join(enter => {
    //         console.log(enter);
    //         enter
    //             .append('path')
    //             .attr('d', d => line(d) )
    //             .attr('stroke', lineColor );
    //     },
    //     update => {
    //         console.log(update);
    //         update
    //             .attr('d', d => line(d) )
    //             .attr('stroke', lineColor );

    //     },
    //     exit => {
    //         console.log(exit);
    //         exit.remove()

    //         }
    //     );


    svg.append("g")
        .attr('class', 'axis')
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale).ticks(height / 80) );

    svg.append("g")
        .attr('class', 'axis')
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(width / 80) );
};

let timeout;
const handlerResize = () => {
    if(timeout) { clearTimeout(timeout); }
    timeout = setTimeout( () => { 
        let dims = computeDims();
        chartWidth = dims.width;
        chartHeight = dims.height;
    }, 500);
};

const handlerMount = () => {
    container = d3.select('.svg-container');
    svg = container.select('svg');
    svg.append('g').attr('class', 'chart');
    svg.append('g').attr('class', 'lineMovingAvg');
    
    let dims = computeDims();
    chartWidth = dims.width;
    chartHeight = dims.height;
};

onMount(handlerMount);

</script>
<style>
    .svg-container { 
        background-color: #e9e9e9;
        height: 30vh; 
    }
    @media (min-width: 640px) {
        .svg-container { height: 75vh; }
    }
</style>


<svelte:window on:resize={handlerResize} />

<div class="svg-container"><svg class="svg-content" viewBox="0 0 {chartWidth} {chartHeight}"></svg></div>