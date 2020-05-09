import axios from 'axios';
import moment from 'moment';
import { addSpacesToWord } from './lib/helpers.js';

const statesList = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AS": "American Samoa",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "DC": "District Of Columbia",
    "FM": "Federated States Of Micronesia",
    "FL": "Florida",
    "GA": "Georgia",
    "GU": "Guam",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MH": "Marshall Islands",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "MP": "Northern Mariana Islands",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PW": "Palau",
    "PA": "Pennsylvania",
    "PR": "Puerto Rico",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VI": "Virgin Islands",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
};

const setupHeaders =  header => {
    let className = '';
    let defaultSort = 'desc';
    let label = header.charAt(0).toUpperCase() + header.substring(1);

    switch(header) {
        case 'date':
            defaultSort = 'asc';
            break;
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
        stateName: statesList[state],
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
    let day = moment(timestamp).format('dddd');
    let posPercentage = (totalTestResults > 0) ? 
        parseFloat( (positive/totalTestResults*100).toFixed(1) ) : 'N/A';
    let deathPercentage = (positive > 0) ? 
        parseFloat((death/positive*100).toFixed(1)) : 'N/A';

    return {
        date,
        day,
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
        let headeExclusionList = [];
        let formattedJson = {};

        switch(type) {
            case 'total':
                url += `states/${dateString}`;
                localStore = 'covidResponse';
                formatFunc = mapCovidDataTotal;
                headeExclusionList = ['positiveIncrease', 'deathIncrease', 
                    'totalTestResultsIncrease', 'stateName'];
                break;
            case 'state':
                url += `state/${state}`;
                localStore = `covidResponse-${state}`;
                formatFunc = mapCovidDataState;
                headeExclusionList = ['positiveIncrease', 'deathIncrease', 
                    'totalTestResultsIncrease', 'day', 'stateName', 'state', 'country'];
                break;

            default: 
                console.error('[model.get] Error getting data, no type provided', params);
                return [];
        }

        try {
            response = JSON.parse( localStorage.getItem(localStore) );
            console.log('[model.get] - Fetching data from localStore', localStore, response);
            
    
            if(!response || response == null || response.timestamp == null || 
                (Date.now() - response.timestamp > cacheTTL) ) { 
                response = await axios.get(url);
                response.data.Items = response.data.Items.map(formatFunc);

                // handle the case where we don't get any items back
                if(response.data.Items.length <= 0) { throw 'Server responded with no Items';  }

                headers = Object.keys(response.data.Items[0]);

                response.data.Headers = headers
                    .filter( header => !headeExclusionList.includes(header) )
                    .map(setupHeaders);

                console.log('[model.get] - Fetching data from API', response);

                localStorage.setItem(localStore, JSON.stringify({...response, timestamp: Date.now() }) );
            }
        }
        catch(e) {
            console.error('[model.get] Error loading covid19 data: ', e);
        }    
        return (response && response.data ) ? { headers: response.data.Headers || [], data: response.data.Items || [] } : { headers: [], data: [] }; 
    };

    const getStates = () => statesList;

    const setCacheTTL = hours => cacheTTL = hours * 60 * 60000;

    return { 
        get,
        getStates,
        setCacheTTL
    };
};

export default model();