<script>
// library, model, and local app store
import { onMount, onDestroy } from 'svelte';

import moment from 'moment';
import model from '../model.js';
import { currentPage, pageTitle, totalPageModel } from '../stores.js';

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

// Use LA Time to get dateString, certain areas of the world can be ahead of us and throw off the map
let curDate = moment()
    .tz('America/Los_Angeles')
    .subtract(1, 'days');
let dateString = curDate.format('YYYYMMDD');

// source data, retrieved from localStorage or the API
let covidData = { headers: [], data: [] };

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

// Set the active tab, deals with a Router refresh that happens from root to sorting a table row
$: activeTab = $totalPageModel.active || 'Confirmed Cases (daily)';

// handlerTabClick will trigger a map change by changing mapType using the store
const handlerTabClick = tab => e => {
    totalPageModel.setMapType(tabTypes[tab]);
    totalPageModel.setActive(tab);
};

const handlerDialogClosed = function(e) { };


onMount(async () => {
    pageTitle.set(`Totals through ${curDate.format('M/DD/YYYY')}`);
    currentPage.set('total');
    
    dialogTitle = "Please wait";
    dialogContent = "Loading";
    
    // There's some sort of focus bug when opening up the dialog sometimes, what could be going on here?
    try { dialogRef.open(); }
    catch(e) { console.error(e); }

    // Fetch the data
    try {
        covidData = await model.get({ type: 'total', dateString });
        dialogRef.close();
    }
    catch(e) {
        dialogTitle = "Error";
        dialogContent = "There was an error loading the page, please try reloading your browser";
        console.error('[Total] There was an error fetching the data', e);
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
    <title>CV Totals for the US ({ curDate.format('M/DD/YYYY') }) </title>
</svelte:head>

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
