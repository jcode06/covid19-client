<script>
// library, model, and local app store
import { onMount, onDestroy } from 'svelte';
import moment from 'moment';
import model from '../model.js';
import { currentPage, pageTitle } from '../stores.js';

// presentational components    
import TodayTable from '../components/TodayTable.svelte';

export let params;

let dateString = moment().subtract(1, 'days').format('YYYYMMDD');
let covidData = [];

const handlerOnMount = async () => {
	let response;

    pageTitle.set('Totals');
    currentPage.set('total');

    covidData = await model.get({ type: 'total', dateString });
};
onMount(handlerOnMount);
</script>

<svelte:head>
    <title>CV Totals for the US</title>
</svelte:head>

<h1>Covid Data for <span>{ moment(dateString).format('MM/DD/YYYY')}</span></h1>
<TodayTable {params} dataset={covidData} />
