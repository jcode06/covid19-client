<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    import DataTable, {Head, Body, Row, Cell} from '@smui/data-table';

    export let dataset = {};
    let headers = [], tableData = [];


    // Updates whenever the dataset prop is updated
    $: headers = (dataset && dataset.headers) ? dataset.headers : [];

    // Update tableData when dataset is updated
    $: tableData = (dataset && dataset.headers) ? dataset.data : [];


    const handlerHeaderClick = e => dispatch('headerClick', e);
    const handlerRowClick = e => dispatch('rowClick', e);

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
            width: 50%;
            height: 80vh;        
        }
	}  
</style>

{#if headers && headers.length > 0 && tableData && tableData.length > 0}
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
        {#each tableData as row, rowIndex}
            <Row on:click={handlerRowClick}>
                {#each Object.values(row) as cell, cellIndex}
                {#if cell.href != null }
                <Cell><a href={cell.href}>{cell.text}</a></Cell>
                {:else}
                <Cell>{cell}</Cell>
                {/if}
                {/each}
            </Row>
        {/each}
        </Body>
    </DataTable>
</section>
{/if}