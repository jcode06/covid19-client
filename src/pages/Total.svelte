<script>
// library, model, and local app store
import { onMount, onDestroy } from 'svelte';
import { push } from 'svelte-spa-router';

import moment from 'moment';
import model from '../model.js';
import { currentPage, pageTitle, totalPageModel } from '../stores.js';

// presentational components    
import Tab, {Icon, Label} from '@smui/tab';
import TabBar from '@smui/tab-bar';
import Dialog, {Content, Actions, Title} from '@smui/dialog';
import LinearProgress from '@smui/linear-progress';


import DisplayTable from '../components/DisplayTable.svelte';

import MapChart from '../components/MapChart.svelte';

export let params;

// Map related Data
const mapTypes = {
    'death': {
        attribute: 'death',
        title: 'Total Deaths by State',
        color: 'orange'
    },
    'positive': {
        attribute: 'positive',
        title: 'Total Confirmed Positives by State',
        color: 'blue'
    },
    'totalTestResults': {
        attribute: 'totalTestResults',
        title: 'Total Tests by State',
        color: 'green'
    },        
    'deathIncrease': {
        attribute: 'deathIncrease',
        title: 'Daily Mortality',
        color: 'orange'
    },        
    'positiveIncrease': {
        attribute: 'positiveIncrease',
        title: 'Daily Mortality',
        color: 'blue'
    },        
    'totalTestResultsIncrease': {
        attribute: 'totalTestResultsIncrease',
        title: 'Daily Tests',
        color: 'green'
    }   
};
let curMapType = 'positiveIncrease';

// Tab Related Data
let tabTypes = {
    'Confirmed Cases (daily)': 'positiveIncrease',
    'Mortalities (daily)': 'deathIncrease',
    'Tested (daily)': 'totalTestResultsIncrease',

    'Confirmed Cases': 'positive',
    'Mortalities': 'death',
    'Tested': 'totalTestResults'
};
let activeTab = 'Confirmed Cases (daily)';
let tabs = Object.keys(tabTypes);

// Use LA Time to get dateString, certain areas of the world can be ahead of us and throw off the map
let curDate = moment()
    .tz('America/Los_Angeles')
    .subtract(1, 'days');
let dateString = curDate.format('YYYYMMDD');

// source data, retrieved from localStorage or the API
let covidData = [];

// derived data, for the Map and Table components, respectively
let mapJson = {};
let tableData = {};

// Variables to control the sorting on the page, for column sort and direction
let activeColumn = 'state';
let curDir = 'asc';

// local dialog variables
let dialogRef;
let dialogTitle = '';
let dialogContent = '';

// Set the active column and direction from the params
$: { 
    if(params) {
        let { sort, dir } = params;
        activeColumn = sort;
        curDir = dir;
    }
};

// Table Data: Create the total row and the Table data from covidData
$: {
    if(covidData != undefined && covidData.data != undefined) {
        let newData = covidData.data.slice();
        newData = newData.sort(sortTableData(activeColumn, curDir) );
        
        tableData = getTableData(covidData.headers, newData);
    }
}
    
// Map Data: Whenever the curMapType changes, get new mapJson data
$: mapJson = getMapData(covidData.data, curMapType);

const getMapData = (theData, theMapType) => {
    if(theData == undefined) { console.error(`[getMapData] No map data provided`); return; }

    // mapFunc for creating new map data
    // Format: [stateAbbreviation, attribute]
    // I.e. ['CA', 5] for [state, numberCases]
    let mapFunc = attr => state => ([state['stateName'], state[attr]]);

    // attribute will be provided by the current map type
    let { color, title, attribute } = mapTypes[theMapType];

    return Object.assign( new Map( theData.map(mapFunc(attribute) ) ), { title, color } );
};

const sortTableData = (column, direction) => (first, second) => {
    let multiplier = (direction === 'asc') ? 1 : -1;
    return (first[column] < second[column]) ? multiplier * -1 : multiplier * 1;
};

const getTableData = (theHeaders, theData, newCol, newDir) => {
    if(theHeaders == undefined || theData == undefined) 
    { console.error(`[getTableData] No headers/data provided`); return; }

    // get the tableData and create new references
    let newData = { 
        headers: theHeaders.slice(),
        data: theData.slice()
    };

    // create the totals row for the table
    // aggregate the supplied columns
    // order of columns is important, which is why it's initialized
    let totals = theData.reduce( (acc, cur) => {
        let keys = Object.keys(acc);
        for(let key of keys) { acc[key] += cur[key]; }
        return acc;
    }, { positive: 0, death: 0, totalTestResults: 0, pending: 0,
        positiveIncrease: 0, deathIncrease: 0, totalTestResultsIncrease: 0, pendingIncrease: 0
    });

    // pretty up the output 
    totals = {
        positive: `${formatNumber(totals.positive)} (${formatNumber(totals.positiveIncrease)})`,
        death: `${formatNumber(totals.death)} (${formatNumber(totals.deathIncrease)})`,
        totalTestResults: `${formatNumber(totals.totalTestResults)} (${formatNumber(totals.totalTestResultsIncrease)})`,
        posPercentage: '',
        deathPercentage: '',
        hospitalizedCurrently: '',
        inIcuCurrently: '',
        onVentilatorCurrently: '',
        pending: formatNumber(totals.pending)
    };
    totals = { state: 'Totals', ...totals }; 

    // create the table data
    newData.data = newData.data.map(row => {
        let newObj = {};
        for(let prop in row) {
            if(!['stateName', 'country', 'positiveIncrease', 'deathIncrease', 'totalTestResultsIncrease']
                .includes(prop) ) { 
                    newObj[prop] = (isNaN(row[prop])) ? row[prop] : formatNumber(row[prop]); 
                }
        }

        let { state, stateName, positiveIncrease, deathIncrease, totalTestResultsIncrease } = row;

        newObj['state'] = { href: `#/state/${state}/`, text: stateName };

        newObj['positive'] += ` (${formatNumber(positiveIncrease)})`;
        newObj['death'] += ` (${formatNumber(deathIncrease)})`; 
        newObj['totalTestResults'] += ` (${formatNumber(totalTestResultsIncrease)})`; 

        return newObj;
    });
    // put the totals row in the first row of the Table dataset
    newData.data = [totals, ...newData.data];

    return newData;
};

// Helper function for formatting numbers
const formatNumber = number => new Intl.NumberFormat().format(number);

// Handles the sorting that occurs when a user clicks on the Header
const dispatchHandlerHeaderClick = e => {

    let target = e.detail.target;
    if(!target) { console.error('[Total - dispatchHandlerHeaderClick] Unable to sort', e.target); return; }

    let index = target.dataset.index;
    let newColumn = target.dataset.sort;

    // If switching columns, use the new columns default sort
    // Else, same column, toggle between asc/desc
    curDir = (activeColumn !== newColumn) ? covidData.headers[index].defaultSort : 
        ((curDir === 'asc') ? 'desc' : 'asc');
    activeColumn = newColumn;
    
    push(`/sort/${activeColumn}/${curDir}`);
};

// Stub for Row Clicks on the Table
const dispatchHandlerRowClick = e => {
    let target = e.detail.target;
    if(!target) { console.error('Unable to sort', event.target); return; }
};

// handlerTabClick will trigger a map change by changing curMapType
const handlerTabClick = (e) => {
    curMapType = tabTypes[activeTab];
    totalPageModel.setMapType(curMapType);
    totalPageModel.setActive(activeTab);
};

const handlerDialogClosed = function(e) { };


onMount(async () => {
    dialogTitle = "Please wait";
    dialogContent = "Loading";
    
    // There's some sort of focus bug when opening up the dialog sometimes, what could be going on here?
    try { dialogRef.open(); }
    catch(e) { console.error(e); }

    pageTitle.set(`Totals for ${curDate.format('M/DD/YYYY')}`);
    currentPage.set('total');

    if(!$totalPageModel.mapType || $totalPageModel.mapType.length <= 0) { 
        totalPageModel.setMapType(curMapType); 
    }
    else {
        curMapType = $totalPageModel.mapType;
    }
    activeTab = $totalPageModel.active || activeTab;

    // Fetch the data
    try {
        covidData = await model.get({ type: 'total', dateString });
        dialogRef.close();
    }
    catch(e) {
        dialogTitle = "Error";
        dialogContent = "There was an error loading the page, please try reloading your browser";

        console.error('There was an error fetching the data', e);
    }

    mapJson = getMapData(covidData.data, curMapType);
});
</script>

<style type="text/scss">
    h1 { text-align: center; }
   
    .content {
        display: flex;
        flex-direction: column; 
    }
    .content :global(.mdc-data-table th:hover) {
        cursor: pointer;
    }

    .charts { 
        display: flex;
        flex-direction: column;
        max-height: 40vh;
    }


	@media (min-width: 640px) {
        .content {
            flex-direction: row;
        }
        .charts { 
            width: 50%;
            max-height: initial;
        }
    }   
</style>

<svelte:head>
    <title>CV Totals for the US ({ curDate.format('M/DD/YYYY') }) </title>
</svelte:head>

{#if Object.keys(covidData).length > 0}
<section class="content">
    <section class="charts">
        <TabBar tabs={tabs} let:tab bind:active={activeTab} on:click={handlerTabClick}>
            <!-- Notice that the `tab` property is required! -->
            <Tab {tab}>
                <Label>{tab}</Label>
            </Tab>
        </TabBar>
        <MapChart dataset={mapJson}/>
    </section>
    <!-- <TodayTable {params} dataset={covidData} /> -->
    <DisplayTable dataset={tableData} 
    on:headerClick={dispatchHandlerHeaderClick} 
    on:rowClick={dispatchHandlerRowClick} 
    />
</section>
{/if}

<Dialog bind:this={dialogRef} 
    aria-labelledby="simple-title" 
    aria-describedby="simple-content"
    on:MDCDialog:closed={handlerDialogClosed}
>
    <!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
    <Title id="simple-title">{dialogTitle}</Title>
    <Content id="simple-content">{dialogContent}</Content>
    <LinearProgress indeterminate />
</Dialog>
