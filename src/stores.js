import { writable } from 'svelte/store';

const pageTitle = writable('');
const currentPage = writable('');

export { 
    pageTitle,
    currentPage,
};