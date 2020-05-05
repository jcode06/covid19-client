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

let active = 'Confirmeds and Mortalities';
let types = {
    'Confirmeds and Mortalities': { type: 'positive_and_death', colors: ['blue', 'red']  },
    'Confirmed Cases (daily)': { type: 'positiveIncrease', colors: ['blue'] },
    'Mortalities (daily)': { type: 'deathIncrease', colors: ['red'] },
    'Tested (daily)': { type: 'totalTestResultsIncrease', colors: ['green']},
    'Confirmed Cases': { type: 'positive', colors: ['blue']},
    'Mortalities': { type: 'death', colors: ['red']},
    'Tested': { type: 'totalTestResults', colors: ['green'] },
    'Hospitalized': { type: 'hospitalizedCurrently', colors: ['black']},
    'In ICU': { type: 'inIcuCurrently', colors: ['black']},
    'On Ventilator': { type: 'onVentilatorCurrently', colors: ['black']}
};
let tabs = Object.keys(types);
let curType = types[active];


let stateName = '';
let states = model.getStates();
let covidData = [];
let tableData = {};
let chartData = [];

$: state = state || params.state;
$: stateName = states[state];

const getChartData = (data, activeType) => {
    let yReducer = list => (acc, cur) => {
        for(let i=0; i < list.length; i++) {
            if(!acc[i]) { acc[i] = []; }
            acc[i].push(cur[list[i]]);
        }
        return acc;
    };

    let attributes = (activeType.type === 'positive_and_death') ? 
        ['positive', 'death'] : [activeType.type];
    let colors = activeType.colors;

    let xData = data.map(row => new Date(row.date) );
    let yData = data.reduce( yReducer(attributes), []);
    let yMinMax = { min: Math.min(...yData.flat() ), max: Math.max(...yData.flat() ) };

    return { 
        xData, yData,
        labels: { 'x': 'date', 'y': attributes },
        colors,
        min: { x: xData[0], y: yMinMax.min},
        max: { x: xData[xData.length - 1], y: yMinMax.max}
    };    
};

const handlerClick = (e) => {
    curType = types[active];
    chartData = getChartData(covidData.data, curType);
    console.log('[handlerClick] click handled', covidData.data, curType);
};

const handlerOnMount = async () => {
    let response;

    pageTitle.set(stateName);
    currentPage.set('state');

    covidData = await model.get({ type: 'state', state });
    tableData = { headers: [...covidData.headers], data: [...covidData.data] };
    chartData = getChartData(covidData.data, curType);

    window.covidData = covidData;
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
    <title>CV Totals for {stateName}</title>
</svelte:head>

<!-- <h1>Covid Data for <span>{state}</span></h1> -->

<section class="content">
    <section class="charts">
        <TabBar tabs={tabs} let:tab bind:active on:click={handlerClick}>
            <!-- Notice that the `tab` property is required! -->
            <Tab {tab}>
                <Label>{tab}</Label>
            </Tab>
        </TabBar>
        <LineChart dataset={chartData} />
    </section>
    <DatesTable {params} {state} dataset={tableData} />
</section>
