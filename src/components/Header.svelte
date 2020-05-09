<script>
import { push } from 'svelte-spa-router';

import TopAppBar, {Row, Section, Title} from '@smui/top-app-bar';
import IconButton from '@smui/icon-button';
import Select from '@smui/select';
import Option from '../lib/Option.svelte'; // Imported to src b/c there's a bug with the Option.svelte implementation
import Icon from '@smui/select/icon/index';
import HelperText from '@smui/select/helper-text/index';

import { currentPage, pageTitle, currentState } from '../stores.js';
import model from '../model.js';

let states = Object.entries( model.getStates() || [])
    .map( list => ({ state: list[0], stateName: list[1] }))
    // Exclude entities with no data
    .filter( stateObj => !['FM', 'MH', 'PW'].includes(stateObj.state) );
let stateSelected = '';
$: stateSelected = $currentState;


const handlerSelectChange = e => {
    if(! (e && e.target ) ) { console.error('[Header.handlerSelectChange] Error: unable to get Select target'); return; } 
    const state = e.target.value;
    push(`/state/${state}/`);    
};

const handlerMenu = () => {};

const handlerHome = () => {
    window.location = '/#';
};

</script>

<style type="text/scss">
    :global(.headerSelect select) {
        padding: 10px 36px 0 4px;
        height: 3rem;
        font-size: 1.3rem;
    }
</style>

<TopAppBar variant="static" color="primary">
    <Row>
        <Section>
            <!-- <IconButton class="material-icons" on:click={handlerMenu}>menu</IconButton> -->
            {#if $currentPage !== 'total' }
            <Select class="headerSelect"
                value={stateSelected} on:change={handlerSelectChange} >
                <Option value="">- Select a State - </Option>
                {#each states as { state, stateName } }
                    <!-- <Option data-value={stateObj.state}>{stateObj.stateName}</Option> -->

                    <Option value={state} selected={stateSelected === state}>{stateName}</Option>
                {/each}
            </Select>
            {:else}
            <Title>{$pageTitle}</Title>
            {/if}
        </Section>
        <Section align="end" toolbar>
            {#if $currentPage !== 'total' }
            <IconButton class="material-icons" aria-label="Home" on:click={handlerHome}>home</IconButton>
            {/if}
<!-- 
            <IconButton class="material-icons" aria-label="Download">file_download</IconButton>
            <IconButton class="material-icons" aria-label="Print this page">print</IconButton>
            <IconButton class="material-icons" aria-label="Bookmark this page">bookmark</IconButton> 
-->
        </Section>
    </Row>
</TopAppBar>
