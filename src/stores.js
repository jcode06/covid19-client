import { writable } from 'svelte/store';

const curDate = writable('');
const pageTitle = writable('');
const currentPage = writable('');
const currentState = writable('');

const createTotalModel = () => {
    const { subscribe, set, update } = writable({});

    let model = {
        mapType: '',
        active: null
    }

    return {
        subscribe, 
        setMapType: mapType => {
            model = { ...model, mapType };
            set(model);
        },
        setActive: active => {
            model = { ...model, active };
            set(model);
        }
    };
};
const totalPageModel = createTotalModel();

export { 
    totalPageModel,
    
    curDate,
    pageTitle,
    currentState,
    currentPage,
};