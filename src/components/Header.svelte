<script>

import { push } from 'svelte-spa-router';
import moment from 'moment';

import TopAppBar, {Row, Section, Title} from '@smui/top-app-bar';
import IconButton from '@smui/icon-button';
import Select from '@smui/select';
import Option from '../lib/Option.svelte'; // Imported to src b/c there's a bug with the Option.svelte implementation
import Icon from '@smui/select/icon/index';
import HelperText from '@smui/select/helper-text/index';

import { curDate, currentPage, pageTitle, currentState } from '../stores.js';
import model from '../model.js';

// header component variables
let dateStringSelected = '';
let stateSelected = '';

$: stateSelected = $currentState;
$: { 
    if($curDate != undefined && $curDate != '') {
        dateStringSelected = moment($curDate).format('YYYYMMDD');
    }
}


const getDates = () => {
    let starting = moment('20200301', 'YYYYMMDD');
    let ending = moment();

    const NUMDAYS = ending.diff(starting, 'days');

    let dates = [];
    for(let i=0; i <= NUMDAYS; i++) {
        let timestamp = moment(ending)
            .subtract(i, 'days')
            .valueOf();
        dates.push({ value: moment(timestamp).format('YYYYMMDD'), label: moment(timestamp).format('MM/DD/YYYY')});
    }
    return dates;
};

const getStates = () => {
    return Object.entries( model.getStates() || [])
        .map( list => ({ state: list[0], stateName: list[1] }))
        // Exclude entities with no data
        .filter( stateObj => !['FM', 'MH', 'PW'].includes(stateObj.state) );
};

const handlerSelectChange = currentPage => function(e) {
    if(! (e && e.target ) ) { console.error('[Header.handlerSelectChange] Error: unable to get Select target'); return; } 

    switch(currentPage) {
        case 'state':
            push(`#/state/${ e.target.value }/`);    
            break;
        case 'total':
            push(`#/total/${ e.target.value }/`);    
            break;
        break;
    }
};

const handlerMenu = () => {};
const handlerHome = () => window.location = '#';
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
            {#if $currentPage === 'state' }
            <Select class="headerSelect"
                value={stateSelected} on:change={handlerSelectChange($currentPage)} >
                <Option value="">- Select a State - </Option>
                {#each getStates() as { state, stateName } }
                    <Option value={state} selected={stateSelected === state}>{stateName}</Option>
                {/each}
            </Select>
            {:else if $currentPage === 'total' }
            <Title>
                Totals through             
                <Select class="headerSelect"
                    value={dateStringSelected} on:change={handlerSelectChange($currentPage)} >
                    <Option value="">- Select a Date - </Option>
                    {#each getDates() as { label, value } }
                        <Option {value} selected={dateStringSelected === value}>{label}</Option>
                    {/each}
                </Select>
            </Title>
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
