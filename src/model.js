import axios from 'axios';
import moment from 'moment';
import { addSpacesToWord } from './lib/helpers.js';


const setupHeaders =  header => {
    let className = '';
    let defaultSort = 'desc';
    let label = header.charAt(0).toUpperCase() + header.substring(1);

    switch(header) {
        case 'state':
            defaultSort = 'asc';
            break;
        case 'death':
            label = 'Deaths';
            break;
        case 'totalTestResults':
            label = 'Total Tested';
            break;
        case 'posPercentage': 
            label = 'Pos/Total (%)';
            break;
        case 'deathPercentage':
            label = 'Death/Pos (%)';
            break;
        default: 
            label = addSpacesToWord(label);
            break;
    }

    return { label, data: header, defaultSort };
};

const mapCovidDataTotal = row => {
    let { state, positive, death, 
        positiveIncrease, deathIncrease,
        hospitalizedCurrently, inIcuCurrently, onVentilatorCurrently,
        pending, totalTestResults, totalTestResultsIncrease
    } = row;

    let posPercentage = (totalTestResults > 0) ? 
        parseFloat( (positive/totalTestResults*100).toFixed(1) ) : 'N/A';
    let deathPercentage = (positive > 0) ? 
        parseFloat((death/positive*100).toFixed(1)) : 'N/A';
    return {
        state,
        positive, death,
        positiveIncrease, deathIncrease,
        totalTestResults, totalTestResultsIncrease,
        posPercentage, deathPercentage,
        hospitalizedCurrently, inIcuCurrently, onVentilatorCurrently,
        pending
    };
};

const mapCovidDataState = row => {
    let { 
        state, country,
        timestamp, 
        positive, death, 
        positiveIncrease, deathIncrease,
        // hospitalizedCumulative, inIcuCumulative, onVentilatorCumulative,
        hospitalizedCurrently, inIcuCurrently, onVentilatorCurrently,
        pending, totalTestResults, totalTestResultsIncrease
    } = row;

    let date = moment(timestamp).format('MM/DD/YYYY');
    let posPercentage = (totalTestResults > 0) ? 
        parseFloat( (positive/totalTestResults*100).toFixed(1) ) : 'N/A';
    let deathPercentage = (positive > 0) ? 
        parseFloat((death/positive*100).toFixed(1)) : 'N/A';

    return {
        date,
        state, 
        country,
        positive, death,
        positiveIncrease, deathIncrease,
        totalTestResults, totalTestResultsIncrease,
        posPercentage, deathPercentage,
        // hospitalizedCumulative, inIcuCumulative, onVentilatorCumulative,
        hospitalizedCurrently, inIcuCurrently, onVentilatorCurrently,
        pending
    };
};

const model = () => {
    // default is 4 hours = 4 * 60 min * 60 sec
    let cacheTTL = 4 * 60 * 60000;
    let API_ENDPOINT = 'https://johnpangilinan-covid19-api.herokuapp.com/api/';

    const get = async params => {
        let { type, state, dateString } = params;
        let url = API_ENDPOINT;
        let localStore = '';
        let headers = [];
        let response = [];
        let formatFunc = null;
        let headerFilterList = [];
        let formattedJson = {};

        switch(type) {
            case 'total':
                url += `states/${dateString}`;
                localStore = 'covidResponse';
                formatFunc = mapCovidDataTotal;
                headerFilterList = ['positiveIncrease', 'deathIncrease', 'totalTestResultsIncrease'];
                break;
            case 'state':
                url += `state/${state}`;
                localStore = `covidResponse-${state}`;
                formatFunc = mapCovidDataState;
                headerFilterList = ['positiveIncrease', 'deathIncrease', 'totalTestResultsIncrease', 'state'];
                break;

            default: 
                console.error('[get] Error getting data, no type provided', params);
                return [];
        }

        try {
            response = JSON.parse( localStorage.getItem(localStore) );
    
            if(typeof response === 'undefined' || !response || (Date.now() - response.timestamp > cacheTTL) ) { 
                console.log('Fetching data from API');
                response = await axios.get(url);
                response.data.Items = response.data.Items.map(formatFunc);
                
                headers = Object.keys(response.data.Items[0]);
                response.data.Headers = headers
                    .filter( header => !headerFilterList.includes(header) )
                    .map(setupHeaders);;

                localStorage.setItem(localStore, JSON.stringify({...response, timestamp: Date.now() }) );
            }
        }
        catch(e) {
            console.error('Error loading covid19 data', e);
        }    
        return (response && response.data ) ? { headers: response.data.Headers, data: response.data.Items } : []; 
    };

    const setCacheTTL = hours => cacheTTL = hours * 60 * 60000;

    return { 
        get,
        setCacheTTL
    };
};

export default model();