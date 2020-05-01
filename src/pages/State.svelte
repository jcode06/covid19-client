<script>
// library, model, and local app store
import { onMount, onDestroy } from 'svelte';
import moment from 'moment';
import model from '../model.js';
import { currentPage, pageTitle } from '../stores.js';

// presentational components
import Tab, {Icon, Label} from '@smui/tab';
import TabBar from '@smui/tab-bar';
import LineChart from '../components/LineChart.svelte';
import DatesTable from '../components/DatesTable.svelte';


export let params;
export let state;

let active = '';

$: state = state || params.state;

let covidData = [];
let chartData = [];


$: chartData = (covidData && Array.isArray(covidData.data)) ? 
    covidData.data.map(row => ({ date: row.date, positive: row.positive, death: row.death })) 
    : [];

const handlerOnMount = async () => {
    let response;

    pageTitle.set(state);
    currentPage.set('state');

    covidData = await model.get({ type: 'state', state });
};

onMount(handlerOnMount);
</script>
<style type="text/scss">
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
            max-width: 50%;
            max-height: initial;
        }
    }
</style>

<svelte:head>
    <title>CV Totals for {state}</title>
</svelte:head>

<!-- <h1>Covid Data for <span>{state}</span></h1> -->

<section class="content">
    <section class="charts">
        <TabBar tabs={['Confirmeds and Mortalities', 'Confirmeds', 'Mortalities']} let:tab bind:active>
            <!-- Notice that the `tab` property is required! -->
            <Tab {tab}>
                <Label>{tab}</Label>
            </Tab>
        </TabBar>
        <LineChart dataset={chartData} />
    </section>
    <DatesTable {params} {state} dataset={covidData} />
</section>
