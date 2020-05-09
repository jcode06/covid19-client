<script>
// library, model, and local app store
import { push } from 'svelte-spa-router';

import moment from 'moment';
import model from '../model.js';
import { currentPage, pageTitle, currentState } from '../stores.js';

// presentational components
import Tab, {Icon, Label} from '@smui/tab';
import TabBar from '@smui/tab-bar';
import LineChart from '../components/LineChart.svelte';
import DisplayTable from '../components/DisplayTable.svelte';


export let params;
export let state;


let activeTab = 'Confirmeds and Mortalities';
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
let curType = types[activeTab];

let stateName = '';
let states = model.getStates();

let covidData = [];
let tableData = {};
let chartData = [];
let isTableLoaded = false;
let isChartLoaded = false;

// For table sorting
let activeColumn = 'date';
let curDir = 'desc';

// Setting the state triggers changes on the page, including changes to covidData
$: {
    (async () => {
        state = params.state;
        stateName = states[state];
        
        pageTitle.set(stateName);
        currentState.set(state);

        covidData = await getData(state);
    })();
};

// Reactive statements for headers & tableData
$: { 
    if(params) {
        let { sort, dir } = params;
        activeColumn = sort;
        curDir = dir;
    }
};

// Set up tableData whenever covidData changes
$: { 
    if(covidData && covidData.data) {
        tableData = { 
            headers: covidData.headers.slice(),
            data: covidData.data.slice()
        };
        tableData.data = tableData.data.sort(sortData(activeColumn, curDir) );
        tableData.data = tableData.data.map(row => {
            let newObj = {};
            for(let prop in row) {
                if(!['state', 'country', 'day',
                'positiveIncrease', 'deathIncrease', 'totalTestResultsIncrease']
                    .includes(prop) ) { newObj[prop] = row[prop]; }
            }

            // custom attributes
            newObj['date'] = `${row.date} (${row.day})`;
            newObj['positive'] += ` (${row.positiveIncrease})`;
            newObj['death'] += ` (${row.deathIncrease})`; 
            newObj['totalTestResults'] += ` (${row.totalTestResultsIncrease})`; 

            return newObj;
        });
    }
}

$: chartData = (covidData && covidData.data && covidData.data.length > 0) ? getChartData([...covidData.data], curType) : [];

$: isTableLoaded = (tableData && tableData.headers && tableData.data);
$: isChartLoaded = (chartData && chartData.xData && chartData.yData);



const getChartData = (data, activeType) => {
    if(!Array.isArray(data) ) { return []; }

    let attributes, colors,
        xData = [], yData = [],
        yMinMax = { min: 0, max: 0 };
    

    let yReducer = list => (acc, cur) => {
        for(let i=0; i < list.length; i++) {
            if(!acc[i]) { acc[i] = []; }
            acc[i].push(cur[list[i]]);
        }
        return acc;
    };

    attributes = (activeType.type === 'positive_and_death') ? 
        ['positive', 'death'] : [activeType.type];
    colors = activeType.colors;

    xData = data.map(row => new Date(row.date) );
    yData = data.reduce( yReducer(attributes), []);
    yMinMax = { min: Math.min(...yData.flat() ), max: Math.max(...yData.flat() ) };


    return { 
        xData, yData,
        labels: { 'x': 'date', 'y': attributes },
        colors,
        min: { x: xData[0], y: yMinMax.min},
        max: { x: xData[xData.length - 1], y: yMinMax.max}
    };    
};

const sortData = (column, direction) => (first, second) => {
    let multiplier = (direction === 'asc') ? 1 : -1;
    return (first[column] < second[column]) ? multiplier * -1 : multiplier * 1;
};

const getData = async curState => {

    if(!curState) { console.error('No state present'); return; }

    let data = [];
    try {
        data = await model.get({ type: 'state', state: curState });
    }
    catch(e) {
        console.error('[State - getData] - Error loading covidData', e);
    }
    return data;
}

// Handles the sorting that occurs when a user clicks on the Header
const dispatchHandlerHeaderClick = e => {

    let target = e.detail.target;
    if(!target) { console.error('[State - dispatchHandlerHeaderClick] Unable to sort', event.target); return; }

    let index = target.dataset.index;
    let newColumn = target.dataset.sort;

    // If switching columns, use the new columns default sort
    // Else, same column, toggle between asc/desc
    curDir = (activeColumn !== newColumn) ? covidData.headers[index].defaultSort : 
        ((curDir === 'asc') ? 'desc' : 'asc');
    activeColumn = newColumn;
    
    push(`/state/${state}/sort/${activeColumn}/${curDir}`);    
};

const dispatchHandlerRowClick = e => {
    let target = e.detail.target;
    if(!target) { console.error('Unable to sort', event.target); return; }

};

const handlerClick = (e) => {
    curType = types[activeTab];
    chartData = getChartData(covidData.data, curType);
};

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

<section class="content">
    <section class="charts">
        <TabBar tabs={tabs} let:tab bind:active={activeTab} on:click={handlerClick}>
            <!-- Notice that the `tab` property is required! -->
            <Tab {tab}>
                <Label>{tab}</Label>
            </Tab>
        </TabBar>
        {#if isChartLoaded}
        <LineChart dataset={chartData} />
        {/if}
    </section>
    {#if isTableLoaded}
    <DisplayTable dataset={tableData} 
        on:headerClick={dispatchHandlerHeaderClick} 
        on:rowClick={dispatchHandlerRowClick} 
    />
    {/if}
</section>