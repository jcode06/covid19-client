<script>
    import { push } from 'svelte-spa-router';

    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';

    export let params;
    export let dataset = {};

    let curState = '';
    let activeColumn = '';
    let curDir = '';

    let headers = [];
    let tableData = [];
    
    // Reactive statements for headers & tableData
    // Set up parameters
    $: { 
        if(params) {
            let { sort, dir, state } = params;
            activeColumn = sort;
            curDir = dir;
            curState = state;
        }
    };

    // Updates whenever the dataset prop is updated
    $: { 
        headers = (dataset && dataset.headers) ? dataset.headers : [];
        tableData = (dataset && dataset.headers) ? dataset.data : [];
        console.log('[DatesTable.svelte - mutate] dataset prop updated...');        
    };

    // sort when activeColumn or dir are updated
    $: {
        if(activeColumn && curDir) {  
            tableData.sort(sortData(activeColumn, curDir) );
            tableData = tableData;
            console.log('[DatesTable.svelte - mutate] tableData sorted...', activeColumn, curDir);
        }
    };

    const sortData = (column, direction) => (first, second) => {
        let multiplier = (direction === 'asc') ? 1 : -1;
        return (first[column] < second[column]) ? multiplier * -1 : multiplier * 1;
    };

    const handlerHeaderClick = event => {
        let target = event.target;
        if(!target) { console.error('Unable to sort', event.target); return; }

        let index = target.dataset.index;
        let newColumn = target.dataset.sort;

        // If switching columns, use the new columns default sort
        // Else, same column, toggle between asc/desc
        curDir = (activeColumn !== newColumn) ? headers[index].defaultSort : 
            ((curDir === 'asc') ? 'desc' : 'asc');
        activeColumn = newColumn;
        
        push(`/state/${curState}/sort/${activeColumn}/${curDir}`);
    };
</script>

<style type="text/scss">
    $header-color: #b9dfff;

    section.table-container { 
        width: 100%;
        height: 50vh;        
        overflow: auto;
        border: solid 1px $header-color; 
        
    }

	@media (min-width: 640px) {
        section.table-container { 
            height: 80vh;        
        }
	}
</style>

<section class="table-container">
    <DataTable>
        <Head>
            <Row on:click={handlerHeaderClick}>
            {#each headers as header, index} 
                <Cell data-index={index} data-sort={header.data} class={header.data} >{header.label}</Cell>
            {/each}
            </Row>
        </Head>
        <Body>
        {#each tableData as row, index}
            <Row>
                <Cell>{row.date}</Cell>

                <Cell class="positive">{row.positive} <span class="daily">({row.positiveIncrease})</span></Cell>
                <Cell class="death">{row.death} <span class="daily">({row.deathIncrease})</span></Cell>

                <Cell>{row.totalTestResults} <span class="daily">(+{row.totalTestResultsIncrease})</span></Cell>

                <Cell class="positive">{row.posPercentage}%</Cell>
                <Cell class="death">{row.deathPercentage}%</Cell>

                <Cell>{row.hospitalizedCurrently}</Cell>
                <Cell>{row.inIcuCurrently}</Cell>
                <Cell>{row.onVentilatorCurrently}</Cell>

                <Cell>{row.pending}</Cell>
            </Row>
        {/each}
        </Body>
    </DataTable>
</section>
