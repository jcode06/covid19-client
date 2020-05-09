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
// import TodayTable from '../components/TodayTable.svelte';
import DisplayTable from '../components/DisplayTable.svelte';

import MapChart from '../components/MapChart.svelte';

export let params;

let activeTab = 'Confirmed Cases (daily)';
let types = {
    'Confirmed Cases (daily)': 'positiveIncrease',
    'Mortalities (daily)': 'deathIncrease',
    'Tested (daily)': 'totalTestResultsIncrease',

    'Confirmed Cases': 'positive',
    'Mortalities': 'death',
    'Tested': 'totalTestResults'
};
let tabs = Object.keys(types);
let curType = 'positive';

let dateString = moment().subtract(1, 'days').format('YYYYMMDD');
let mapJson = {};

let covidData = [];
let tableData = {};

// For table sorting
let activeColumn = 'state';
let curDir = 'asc';


let response;

// Reactive statements for headers & tableData
$: { 
    if(params) {
        let { sort, dir } = params;
        activeColumn = sort;
        curDir = dir;
    }
};

$: { 
    if(covidData && covidData.data) {
        tableData = { 
            headers: covidData.headers.slice(),
            data: covidData.data.slice()
        };

        let totals = covidData.data.reduce( (acc, cur) => {
            let keys = Object.keys(acc);

            for(let key of keys) {
                acc[key] += cur[key];
            }
        
            return acc;
        }, { positive: 0, death: 0, totalTestResults: 0, pending: 0,
            positiveIncrease: 0, deathIncrease: 0, totalTestResultsIncrease: 0, pendingIncrease: 0
        });
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

        tableData.data = tableData.data.sort(sortData(activeColumn, curDir) );
        tableData.data = tableData.data.map(row => {
            let newObj = {};
            for(let prop in row) {
                if(!['stateName', 'country', 'positiveIncrease', 'deathIncrease', 'totalTestResultsIncrease']
                    .includes(prop) ) { 
                        newObj[prop] = (isNaN(row[prop])) ? row[prop] : formatNumber(row[prop]); 
                    }
            }

            newObj['state'] = { href: `#/state/${row.state}/`, text: row.stateName };

            newObj['positive'] += ` (${formatNumber(row.positiveIncrease)})`;
            newObj['death'] += ` (${formatNumber(row.deathIncrease)})`; 
            newObj['totalTestResults'] += ` (${formatNumber(row.totalTestResultsIncrease)})`; 

            return newObj;
        });
        tableData.data = [totals, ...tableData.data];
    }
}

const formatNumber = number => new Intl.NumberFormat().format(number);

const getMapData = (theData, type) => {
    let mapFunc = () => {};
    let color = '';
    let title = '';
    switch(type) {
        case 'death':
            mapFunc = state => ([state.stateName, state.death]);
            title = 'Total Deaths by State';
            color = 'orange';
            break;
        case 'positive':
            mapFunc = state => ([state.stateName, state.positive]);
            title = 'Total Confirmed Positives by State';
            color = 'blue';
            break;
        case 'totalTestResults':
            mapFunc = state => ([state.stateName, state.totalTestResults]);
            title = 'Total Tests by State';
            color = 'green';
            break;
        case 'deathIncrease':
            mapFunc = state => ([state.stateName, state.deathIncrease]);
            title = 'Daily Mortality';
            color = 'orange';
            break;
        case 'positiveIncrease':
            mapFunc = state => ([state.stateName, state.positiveIncrease]);
            title = 'Daily Confirmed Cases';
            color = 'blue';
            break;
        case 'totalTestResultsIncrease':
            mapFunc = state => ([state.stateName, state.totalTestResultsIncrease]);
            title = 'Daily Tests';
            color = 'green';
            break;
    }

    return Object.assign( new Map( theData.map(mapFunc) ), { title, color } );
};

const sortData = (column, direction) => (first, second) => {
    let multiplier = (direction === 'asc') ? 1 : -1;
    return (first[column] < second[column]) ? multiplier * -1 : multiplier * 1;
};

// Handles the sorting that occurs when a user clicks on the Header
const dispatchHandlerHeaderClick = e => {

    let target = e.detail.target;
    if(!target) { console.error('[Total - dispatchHandlerHeaderClick] Unable to sort', event.target); return; }

    let index = target.dataset.index;
    let newColumn = target.dataset.sort;

    // If switching columns, use the new columns default sort
    // Else, same column, toggle between asc/desc
    curDir = (activeColumn !== newColumn) ? covidData.headers[index].defaultSort : 
        ((curDir === 'asc') ? 'desc' : 'asc');
    activeColumn = newColumn;
    
    push(`/sort/${activeColumn}/${curDir}`);
};

const dispatchHandlerRowClick = e => {
    let target = e.detail.target;
    if(!target) { console.error('Unable to sort', event.target); return; }

};

const handlerClick = (e) => {
    curType = types[activeTab];
    mapJson = getMapData(covidData.data, curType);

    totalPageModel.setMapType(curType);
    totalPageModel.setActive(activeTab);
};

const handlerOnMount = async () => {
	let response;

    pageTitle.set('Totals');
    currentPage.set('total');

    covidData = await model.get({ type: 'total', dateString });

    if(!$totalPageModel.mapType || $totalPageModel.mapType.length <= 0) { 
        totalPageModel.setMapType(curType); 
    }
    else {
        curType = $totalPageModel.mapType;
    }
    activeTab = $totalPageModel.active || activeTab;
    mapJson = getMapData(covidData.data, curType);
};
onMount(handlerOnMount);
</script>

<style type="text/scss">
    h1 { text-align: center; }
   
    .content {
        display: flex;
        flex-direction: column; 
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
    <title>CV Totals for the US</title>
</svelte:head>

<section class="content">
    <!-- <h1>Covid Data for <span>{ moment(dateString).format('MM/DD/YYYY')}</span></h1> -->

    <section class="charts">
        <TabBar tabs={tabs} let:tab bind:active={activeTab} on:click={handlerClick}>
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
