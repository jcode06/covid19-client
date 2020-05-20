<script>
import { push } from 'svelte-spa-router';

import MapChart from '../../components/MapChart.svelte';
import Tooltip from '../../components/Tooltip.svelte';

import { totalPageModel } from '../../stores.js';

export let data = [];

// The different available Maps
const mapTypes = {
    'positiveIncrease': {
        attribute: 'positiveIncrease',
        label: 'Daily Mortality',
        color: 'blue'
    },        
    'deathIncrease': {
        attribute: 'deathIncrease',
        label: 'Daily Mortality',
        color: 'orange'
    },        
    'totalTestResultsIncrease': {
        attribute: 'totalTestResultsIncrease',
        label: 'Daily Tests',
        color: 'green'
    },  
    'positive': {
        attribute: 'positive',
        label: 'Total Confirmed Positives by State',
        color: 'blue'
    },
    'death': {
        attribute: 'death',
        label: 'Total Deaths by State',
        color: 'orange'
    },
    'totalTestResults': {
        attribute: 'totalTestResults',
        label: 'Total Tests by State',
        color: 'green'
    }    
};
let mapType = '';
let mapJson = {};

// Values for mousemove/mouseout
let x = 0;
let y = 0;
let display = false;
let tooltipContents = '';


$: mapType = $totalPageModel.mapType || 'positiveIncrease';

// Map Data: Whenever the mapType changes, get new mapJson data
$: mapJson = getMapData(data, mapType);

const getMapData = (theData, theMapType) => {
    if(theData == undefined) { console.error(`[MapSection.getMapData] No map data provided`); return; }

    // mapFunc for creating new map data
    // Format: [stateAbbreviation, attribute]
    // I.e. ['CA', 5] for [state, numberCases]
    let mapFunc = attr => state => ([state['stateName'], state[attr]]);

    // attribute will be provided by the current map type
    let { color, label, attribute } = mapTypes[theMapType];

    return Object.assign( new Map( theData.map(mapFunc(attribute) ) ), { label, color } );
};

const showTooltip = eventDetail => {
    let margin = { x: 0.85, y: 0.85 };
    let width, height, name, value;
    // x & y are global to this function, local to component
    ({ x, y, width, height, name, value } = eventDetail);

    x = x + 10;
    y = y + 10;

    // if in either right or bottom edge, limit the tooltip to 80% of width/height
    if(x < width - width * margin.x) { x = width - width * margin.x; }
    else if(x > width * margin.x) { x = width * margin.x - (width - width * margin.x); }
    if(y < height - height * margin.y) { y = height - height * margin.y; }
    else if(y > height * margin.y) { y = height * margin.y - (height - height * margin.y); }

    // offset x/y so we don't trigger mouseout events
    tooltipContents = `${name}: ${value}`;

    // Show the tooltip
    display = true;
};

const handlerMapClick = function(e) {
//    console.log(data, e);
    let result = data.filter(entry => entry.stateName === e.detail.name);
    if(result != undefined && result.length === 1) {
        push(`#/state/${result[0].state}/`);
    }
};

const handlerMapMouseover = function(e) {
    showTooltip(e.detail);
};

const handlerMapMouseout = function(e) {
    display = false;
}

const handlerMapTouchend = function(e) {
    // console.log(e);
    // showTooltip(e.detail);
}


</script>

    <!-- 
        on:mapClick={handlerMapClick}  
    -->


<MapChart dataset={mapJson}
    on:mapMouseover={handlerMapMouseover} 
    on:mapMouseout={handlerMapMouseout}
>
    <Tooltip {x} {y} {display}>{tooltipContents}</Tooltip>
</MapChart>

