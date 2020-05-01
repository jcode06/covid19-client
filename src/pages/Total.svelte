<script>
import { onMount, onDestroy } from 'svelte';
import axios from 'axios';
import moment from 'moment';

import TodayTable from '../components/TodayTable.svelte';
import { addSpacesToWord } from '../lib/helpers.js';
import { currentPage, pageTitle } from '../stores.js';

export let params;
//export let dateString;
let dateString = moment().subtract(1, 'days').format('YYYYMMDD');

const API_ENDPOINT = 'https://johnpangilinan-covid19-api.herokuapp.com/api/';

let covidData = [];
let formattedData = [];

$: {
    console.log(covidData);
    let newData = covidData.map( mapCovidData );

    if(newData && newData.length > 0) {
        let headers = Object.keys(newData[0]);
        headers = headers
            .filter( header => 
                !['positiveIncrease', 'deathIncrease', 
                'totalTestResultsIncrease'].includes(header) )
            .map(setupHeaders);
        formattedData = { headers, data: newData };
    }
};

const mapCovidData = row => {
    let { state, positive, death, 
        positiveIncrease, deathIncrease,
        hospitalizedCurrently, inIcuCurrently, onVentilatorCurrently,
        pending, totalTestResults, totalTestResultsIncrease
    } = row;

    let posPercentage = (totalTestResults > 0) ? 
        parseFloat( (positive/totalTestResults*100).toFixed(1) ) : 'N/A';
    let deathPercentage = (positive > 0) ? 
        parseFloat((death/positive*100).toFixed(1)) : 'N/A';
    return {
        state,
        positive, death,
        positiveIncrease, deathIncrease,
        totalTestResults, totalTestResultsIncrease,
        posPercentage, deathPercentage,
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

    if( header === 'state' ) { defaultSort: 'asc'; }

    return { label, data: header, defaultSort };
};

const handlerOnMount = async () => {
	let response;

    pageTitle.set('Totals');
    currentPage.set('total');

	try {
        response = JSON.parse( localStorage.getItem('covidResponse') );

        // 4 hours = 4 * 60 min * 60 sec
        let cacheTTL = 4 * 60 * 60000;

		if(typeof response === 'undefined' || !response || (Date.now() - response.timestamp > cacheTTL) ) { 
			console.log('Fetching data from API');
			response = await axios.get(`${API_ENDPOINT}states/${dateString}`);
			localStorage.setItem('covidResponse', JSON.stringify({...response, dateString, timestamp: Date.now() }) );
		}
	}
	catch(e) {
		console.error('Error loading covid19 data', e);
	}

	covidData = (response && response.data) ? response.data.Items : [];
};
onMount(handlerOnMount);
</script>

<svelte:head>
    <title>CV Totals for the US</title>
</svelte:head>

<h1>Covid Data for <span>{ moment(dateString).format('MM/DD/YYYY')}</span></h1>
<TodayTable {params} dataset={formattedData} />
