<script>
// library, model, and local app store
import { onMount, onDestroy } from 'svelte';
import moment from 'moment';
import model from '../model.js';
import { currentPage, pageTitle } from '../stores.js';

// presentational components    
import Tab, {Icon, Label} from '@smui/tab';
import TabBar from '@smui/tab-bar';
import TodayTable from '../components/TodayTable.svelte';
import MapChart from '../components/MapChart.svelte';

export let params;

let active = 'Positives';
let tabs = ['Positives', 'Mortalities', 'Tested'];
let types = {
    'Positives': 'positive',
    'Mortalities': 'death',
    'Tested': 'tested'
};

let type = 'positive';
let dateString = moment().subtract(1, 'days').format('YYYYMMDD');
let covidData = [];
let mapJson = {};

let response;

const getMapData = (theData, curType) => {
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
        case 'tested':
            mapFunc = state => ([state.stateName, state.totalTestResults]);
            title = 'Total Tests by State';
            color = 'green';
            break;
    }

    return Object.assign( new Map( theData.map(mapFunc) ), { title, color } );
};

const handlerClick = (e) => {
    console.log(active, e);
    type = types[active];
    mapJson = getMapData(covidData.data, type);

    console.log('click', type, mapJson);
};

const handlerOnMount = async () => {
	let response;

    pageTitle.set('Totals');
    currentPage.set('total');

    covidData = await model.get({ type: 'total', dateString });

    mapJson = getMapData(covidData.data, type);
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
