<script>
import DisplayTable from '../../components/DisplayTable.svelte';
import { push } from 'svelte-spa-router';

export let data = [];
export let headers = [];
export let activeColumn = '';
export let curDir = '';

let tableData = {};

$: {
    let newData = data.slice();
    newData = newData.sort(sortTableData(activeColumn, curDir) );
    
    tableData = getTableData(headers, newData);
}

const sortTableData = (column, direction) => (first, second) => {
    let multiplier = (direction === 'asc') ? 1 : -1;
    return (first[column] < second[column]) ? multiplier * -1 : multiplier * 1;
};

const getTableData = (theHeaders, theData) => {
    if(theHeaders == undefined || theData == undefined) 
    { console.error(`[TableSection.getTableData] No headers/data provided`); return; }

    // get the tableData and create new references
    let newData = { 
        headers: theHeaders.slice(),
        data: theData.slice()
    };

    // For creating the cells in each row of the table
    let tableCells = newData.headers.map(entry => entry.data);

    // create the totals row for the table
    // aggregate the supplied columns
    // order of columns is important, which is why it's initialized
    let totals = theData.reduce( (acc, cur) => {
        let keys = Object.keys(acc);
        for(let key of keys) { acc[key] += cur[key]; }
        return acc;
    }, { positive: 0, death: 0, totalTestResults: 0, pending: 0,
        positiveIncrease: 0, deathIncrease: 0, totalTestResultsIncrease: 0, pendingIncrease: 0,
        hospitalizedCurrently: 0, inIcuCurrently: 0, onVentilatorCurrently: 0
    });
    totals.posPercentage = (totals.positive / totals.totalTestResults * 100).toFixed(1);
    totals.deathPercentage = (totals.death / totals.positive * 100).toFixed(1);

    // pretty up the output
    // take out non output columns
    totals = {
        positive: `${formatNumber(totals.positive)} (${formatNumber(totals.positiveIncrease)})`,
        death: `${formatNumber(totals.death)} (${formatNumber(totals.deathIncrease)})`,
        totalTestResults: `${formatNumber(totals.totalTestResults)} (${formatNumber(totals.totalTestResultsIncrease)})`,
        posPercentage: totals.posPercentage,
        deathPercentage: totals.deathPercentage,
        hospitalizedCurrently: formatNumber(totals.hospitalizedCurrently),
        inIcuCurrently: formatNumber(totals.inIcuCurrently),
        onVentilatorCurrently: formatNumber(totals.onVentilatorCurrently),
        pending: formatNumber(totals.pending)
    };
    totals = { state: 'Totals', ...totals }; 

    // create the table data, including the custom rows
    newData.data = newData.data.map(entry => {
        let newRow = {};
        // insert only the cells present in the Header into the entry
        for(let prop of tableCells) {
            newRow[prop] = (isNaN(entry[prop])) ? entry[prop] : formatNumber(entry[prop]); 
        }

        let { state, stateName, positiveIncrease, deathIncrease, totalTestResultsIncrease } = entry;

        // Custom Cells 
        newRow['state'] = { href: `#/state/${state}/`, text: stateName }; 
        newRow['positive'] += ` (${formatNumber(positiveIncrease)})`;
        newRow['death'] += ` (${formatNumber(deathIncrease)})`; 
        newRow['totalTestResults'] += ` (${formatNumber(totalTestResultsIncrease)})`; 

        return newRow;
    });
    // put the totals row in the first row of the Table dataset
    newData.data = [totals, ...newData.data];

    return newData;
};

// Helper function for formatting numbers
const formatNumber = number => new Intl.NumberFormat().format(number);

const dispatchHandlerHeaderClick = e => {

    let target = e.detail.target;
    if(!target) { console.error('[TableSection.dispatchHandlerHeaderClick] Unable to sort', e.target); return; }

    let index = target.dataset.index;
    let newColumn = target.dataset.sort;

    // If switching columns, use the new columns default sort
    // Else, same column, toggle between asc/desc
    curDir = (activeColumn !== newColumn) ? headers[index].defaultSort : 
        ((curDir === 'asc') ? 'desc' : 'asc');
    activeColumn = newColumn;
    
    push(`/sort/${activeColumn}/${curDir}`);
};

// Stub for Row Clicks on the Table
const dispatchHandlerRowClick = e => {
    let target = e.detail.target;
    if(!target) { console.error('[TableSection.dispatchHandlerRowClick] Error on Table Row Click', e.target); return; }
};

</script>

<DisplayTable dataset={tableData} 
    on:headerClick={dispatchHandlerHeaderClick} 
    on:rowClick={dispatchHandlerRowClick} 
/>
