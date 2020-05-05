<script>
// library, model, and local app store
import { onMount, onDestroy } from 'svelte';
import moment from 'moment';
import model from '../model.js';
import { currentPage, pageTitle, totalPageModel } from '../stores.js';

// presentational components    
import Tab, {Icon, Label} from '@smui/tab';
import TabBar from '@smui/tab-bar';
import TodayTable from '../components/TodayTable.svelte';
import MapChart from '../components/MapChart.svelte';

export let params;

let active = 'Confirmed Cases (daily)';
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
let covidData = [];
let mapJson = {};

let response;

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

const handlerClick = (e) => {
    curType = types[active];
    mapJson = getMapData(covidData.data, curType);

    totalPageModel.setMapType(curType);
    totalPageModel.setActive(active);

    console.log('[handlerClick]', curType, mapJson, $totalPageModel);
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
    active = $totalPageModel.active || active;
    mapJson = getMapData(covidData.data, curType);

    console.log('[handlerOnMount]', covidData.data, curType, $totalPageModel);
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
        <TabBar tabs={tabs} let:tab bind:active on:click={handlerClick}>
            <!-- Notice that the `tab` property is required! -->
            <Tab {tab}>
                <Label>{tab}</Label>
            </Tab>
        </TabBar>
        <MapChart dataset={mapJson}/>
    </section>
    <TodayTable {params} dataset={covidData} />
</section>
