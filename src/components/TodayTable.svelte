<script>
    import { onMount, onDestroy } from 'svelte';
    import { push } from 'svelte-spa-router';

    export let params;
    export let dataset = {};


    let activeColumn = '';
    let curDir = '';
    let headers = [];
    let tableData = [];
    
    // Reactive statements for headers & tableData

    // Updates whenever the dataset prop is updated
    $: headers = (dataset && dataset.headers) ? dataset.headers : [];

    // Update tableData when dataset is updated
    $: tableData = (dataset && dataset.headers) ? dataset.data : [];

    $: { 
        if(params) {
            let { sort, dir } = params;
            activeColumn = sort;
            curDir = dir;
        }
    }

    // sort when activeColumn or dir are updated
    $: {
        if(activeColumn && curDir) {  
            console.log('sorting', activeColumn, curDir);

            tableData.sort(sortData(activeColumn, curDir) );
            tableData = tableData;
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
        
        push(`/sort/${activeColumn}/${curDir}`);
    };

    const handlerOnMount = async () => {};

    onMount(handlerOnMount);
</script>

<style>
    section.table-container { 
        width: 100%;
        height: 90vh;        
        overflow: auto;
        border: solid 1px #ffc72a; 

    }
    table { 
        width: 100%;
        margin: 0 auto;
        border-collapse: collapse; 
        overflow: auto;    
    }

    thead tr th { 
        background-color: #ffc72a; 
        position: sticky;
        top: 0;
        z-index: 100;        
    }
    thead tr th:hover { cursor: pointer; }

    thead tr th,
    tbody tr td { 
        text-align: left; 
        padding: 10px 5px;

    }
    tbody {
        flex-direction: column;
        padding-top: 1rem; 
    }
    tbody td { 
        width: 10vh;
    }


    .alternate { background-color: #fff4c9; }

    .positive { 
        text-align: right;
        color: green; 
    }
    .death { color: red; }
    .daily { display: block; font-size: 0.8rem; }
</style>

<section class="table-container">
    <table>
        <thead on:click={handlerHeaderClick}>
        <tr>
            {#each headers as header, index} 
                <th data-index={index} data-sort={header.data} class={header.data} >{header.label}</th>
            {/each}
        </tr>
        </thead>
        <tbody>
        {#each tableData as row, index}
            <tr class:alternate={index % 2 === 0}>
                <td><a href="#/state/{row.state}">{row.state}</a></td>
                <td class="positive">{row.positive} <span class="daily">({row.positiveIncrease})</span></td>
                <td class="death">{row.death} <span class="daily">({row.deathIncrease})</span></td>

                <td>{row.totalTestResults} <span class="daily">(+{row.totalTestResultsIncrease})</span></td>

                <td class="positive">{row.posPercentage}%</td>
                <td class="death">{row.deathPercentage}%</td>

                <td>{row.hospitalizedCurrently}</td>
                <td>{row.inIcuCurrently}</td>
                <td>{row.onVentilatorCurrently}</td>

                <td>{row.pending}</td>
            </tr>
        {/each}
        </tbody>
    </table>
</section>
