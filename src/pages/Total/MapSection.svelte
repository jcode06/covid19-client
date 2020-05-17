<script>
import MapChart from '../../components/MapChart.svelte';
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
</script>

<MapChart dataset={mapJson}/>
