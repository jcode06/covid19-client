<script>
// library, model, and local app store
import { push } from 'svelte-spa-router';
import { onMount, onDestroy } from 'svelte';

import moment from 'moment';
import model from '../model.js';
import { curDate, currentPage, pageTitle, totalPageModel } from '../stores.js';

// presentational components    
import Tab, {Icon, Label} from '@smui/tab';
import TabBar from '@smui/tab-bar';
import Dialog, {Content, Actions, Title} from '@smui/dialog';
import LinearProgress from '@smui/linear-progress';

import TableSection from './Total/TableSection.svelte';
import MapSection from './Total/MapSection.svelte';

// Params are passed from the Router
export let params;

// Tab Related Data
let tabTypes = {
    'Confirmed Cases (daily)': 'positiveIncrease',
    'Mortalities (daily)': 'deathIncrease',
    'Tested (daily)': 'totalTestResultsIncrease',

    'Confirmed Cases': 'positive',
    'Mortalities': 'death',
    'Tested': 'totalTestResults'
};
let activeTab;

// source data, retrieved from localStorage or the API
let covidData = { headers: [], data: [] };

// Variables to control the sorting on the page, for column sort and direction
let activeColumn = 'state';
let curDir = 'asc';

// local dialog variables
let dialogRef;
let dialogTitle = '';
let dialogContent = '';

// Use LA Time to get dateString, certain areas of the world can be ahead of us and throw off the map
let timestampSelected; 

let isFetchingData = false;

// Set the active column, direction, and dateString from the params
// NOTE: params doesn't get triggered if the URL path is the root ('/')
$: { 
    if(params) {
        let { sort, dir, dateString } = params;
        
        activeColumn = sort;
        curDir = dir;
        curDate.set( moment(dateString, 'YYYYMMDD').tz('America/Los_Angeles').valueOf() );
    }
};

// $curDate will be a moment() timestamp
// default will be yesterday's data
//$: timestampSelected = $curDate || moment().tz('America/Los_Angeles').subtract(1, 'days').valueOf();
$: timestampSelected = $curDate;
$: { 
    (async() => {
        if(dialogRef == undefined) { return; }
        if(timestampSelected == undefined || timestampSelected === '') { return; }
        isFetchingData = true;

        console.log('timestampSelected', timestampSelected);
        let dateString = moment(timestampSelected).format('YYYYMMDD');
        covidData = await getData(dateString);

        isFetchingData = false;
    })();
};


// Set the active tab, deals with a Router refresh that happens from root to sorting a table row
$: { 
    // console.log(activeTab);

    // activeTab = $totalPageModel.active || 'Confirmed Cases (daily)';
};


const getData = async curDateString => {
    dialogTitle = "Please wait";
    dialogContent = "Loading";
    
    // There's some sort of focus bug when opening up the dialog sometimes, what could be going on here?
    try { dialogRef.open(); }
    catch(e) { console.error(e); }

    let data = { headers: [], data: [] };
    // Fetch the data
    try {
        data = await model.get({ type: 'total', dateString: curDateString });
        dialogRef.close();
    }
    catch(e) {
        dialogTitle = "Error";
        dialogContent = "There was an error loading the page, please try reloading your browser";
        console.error('[Total.getData] There was an error fetching the data', e);
    }
    return data;
};

// handlerTabClick will trigger a map change by changing mapType using the store
const handlerTabClick = tab => e => {
    totalPageModel.setMapType(tabTypes[tab]);
    totalPageModel.setActive(tab);
};


const handlerKeydown = function(e) {
    if(isFetchingData === true) { return; }
    if(!['ArrowUp', 'ArrowDown'].includes(e.key)) { return; }

    let newDate = e.key === 'ArrowDown' ?
        moment(timestampSelected).tz('UTC').subtract(1, 'days') : 
        moment(timestampSelected).tz('UTC').add(1, 'days');

    if(newDate > moment().tz('UTC') || newDate < moment('20200301', 'YYYYMMDD').tz('UTC') ) { 
        console.log('exceeded todays date');
        return;
    }

    if(activeColumn != 'undefined' && ['asc','desc'].includes(curDir)) {
        push(`#/total/${newDate.format('YYYYMMDD')}/sort/${activeColumn}/${curDir}`);    
    }
    else {
        push(`#/total/${newDate.format('YYYYMMDD')}/`);    
    }
}

const handlerDialogClosed = function(e) { };

onMount(async () => {
    pageTitle.set(`Totals through ${moment(timestampSelected).format('M/DD/YYYY')}`);
    currentPage.set('total');

    // handle the initial page load case, where $curDate will have no value
    // set $curDate to the current timestampSelected, which would be yesterday's date
    if($curDate == undefined || $curDate == '') { 
        // hard code default date to 3/07/2021
        // since the COVID Tracking data project ended their data collection on 03/07/2021
        curDate.set( moment('20210307', 'YYYYMMDD').tz('America/Los_Angeles').valueOf() );
        // curDate.set( moment().tz('America/Los_Angeles').subtract(1, 'days').valueOf() );
    }
});
</script>

<style type="text/scss">
    h1 { text-align: center; }
   
    .content {
        display: flex;
        flex-direction: column; 
    }
    // Style for the child table
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
    <title>CV Totals for the US ({ moment(timestampSelected).format('M/DD/YYYY') }) </title>
</svelte:head>

<svelte:body on:keydown|preventDefault={handlerKeydown} />

{#if Object.keys(covidData).length > 0}
<section class="content">
    <section class="charts">
        <TabBar tabs={Object.keys(tabTypes)} let:tab active={activeTab} >
            <!-- Notice that the `tab` property is required! -->
            <Tab {tab} on:click={handlerTabClick(tab)}>
                <Label>{tab}</Label>
            </Tab>
        </TabBar>
        <MapSection data={covidData.data} />
    </section>

    <TableSection 
        {timestampSelected}
        data={covidData.data}
        headers={covidData.headers}
        {activeColumn}
        {curDir}
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
