<script>
import { onMount, onDestroy } from 'svelte';
import axios from 'axios';
import moment from 'moment';
import Tab, {Icon, Label} from '@smui/tab';
import TabBar from '@smui/tab-bar';

import LineChart from '../components/LineChart.svelte';
import DatesTable from '../components/DatesTable.svelte';
import { addSpacesToWord } from '../lib/helpers.js';
import { currentPage, pageTitle } from '../stores.js';

export let params;
export let state;

let active = '';

$: state = state || params.state;

const API_ENDPOINT = 'https://johnpangilinan-covid19-api.herokuapp.com/api/';

let covidData = [];
let formattedData = [];

$: {
    let newData = covidData.map( mapCovidData );

    if(newData && newData.length > 0) {
        let headers = Object.keys(newData[0]);
        headers = headers
            .filter( header => 
                !['positiveIncrease', 'deathIncrease', 
                'totalTestResultsIncrease', 'state'].includes(header) )
            .map(setupHeaders);

        console.log('[State.svelte - mutate] formattedData updating...');
        formattedData = { headers, data: newData };
    }
};

const mapCovidData = row => {
    let { 
        state, country,
        timestamp, 
        positive, death, 
        positiveIncrease, deathIncrease,
        // hospitalizedCumulative, inIcuCumulative, onVentilatorCumulative,
        hospitalizedCurrently, inIcuCurrently, onVentilatorCurrently,
        pending, totalTestResults, totalTestResultsIncrease
    } = row;

    let date = moment(timestamp).format('MM/DD/YYYY');
    let posPercentage = (totalTestResults > 0) ? 
        parseFloat( (positive/totalTestResults*100).toFixed(1) ) : 'N/A';
    let deathPercentage = (positive > 0) ? 
        parseFloat((death/positive*100).toFixed(1)) : 'N/A';

    return {
        date,
        state, 
        // country,
        positive, death,
        positiveIncrease, deathIncrease,
        totalTestResults, totalTestResultsIncrease,
        posPercentage, deathPercentage,
        // hospitalizedCumulative, inIcuCumulative, onVentilatorCumulative,
        hospitalizedCurrently, inIcuCurrently, onVentilatorCurrently,
        pending
    };
};

const setupHeaders =  header => {
    let className = '';
    let defaultSort = 'desc';
    let label = header.charAt(0).toUpperCase() + header.substring(1);

    switch(header) {
        case 'state':
            defaultSort = 'asc';
            break;
        case 'death':
            label = 'Deaths';
            break;
        case 'totalTestResults':
            label = 'Total Tested';
            break;
        case 'posPercentage': 
            label = 'Pos/Total (%)';
            break;
        case 'deathPercentage':
            label = 'Death/Pos (%)';
            break;
        default: 
            label = addSpacesToWord(label);
            break;
    }

    return { label, data: header, defaultSort };
};

const handlerOnMount = async () => {
    let response;

    pageTitle.set(state);
    currentPage.set('state');

	try {
		response = JSON.parse( localStorage.getItem(`covidResponse-${state}`) );
		if(typeof response === 'undefined' || !response) { 
			console.log('Fetching data from API');
			response = await axios.get(`${API_ENDPOINT}state/${state}`);
			localStorage.setItem(`covidResponse-${state}`, JSON.stringify({...response}) );
		}
	}
	catch(e) {
		console.error('Error loading covid19 data', e);
	}

    console.log('[State.svelte - handlerOnMount] covidData updating...');
    covidData = (response && response.data) ? response.data.Items : [];

    console.log(`covidResponse-${state}`, covidData);
};

onMount(handlerOnMount);
</script>
<style type="text/scss">
    .content {
        display: flex;
        flex-direction: column; 
    }
    .chartsAndData { 
        display: flex;
        flex-direction: column;
    }

	@media (min-width: 640px) {
        .chartsAndData { 
            flex-direction: row;
        }
    }
</style>

<svelte:head>
    <title>CV Totals for {state}</title>
</svelte:head>

<!-- <h1>Covid Data for <span>{state}</span></h1> -->

<section class="content">
    <TabBar tabs={['Positives and Deaths', 'Positives', 'Deaths']} let:tab bind:active>
        <!-- Notice that the `tab` property is required! -->
        <Tab {tab}>
            <Label>{tab}</Label>
        </Tab>
    </TabBar>
    <section class="chartsAndData">
        <LineChart dataset={formattedData.data} />
        <DatesTable {params} {state} dataset={formattedData} />
    </section>
</section>
