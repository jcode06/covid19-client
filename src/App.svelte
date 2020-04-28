<script>	
import { onMount, onDestroy } from 'svelte';
import Router from 'svelte-spa-router';

import Total from './pages/Total.svelte';
import State from './pages/State.svelte';

//export let name;

let dateString = '20200427';
let state = 'NY';

const routes = {
	'/': Total,
	'/sort/:sort?/:dir?': Total,
	'/state/:state': State,
	'/state/:state/sort/:sort?/:dir?': State
};

const handlerOnMount = async () => {
}

onMount(handlerOnMount);
</script>
<style>
	main {
		text-align: center;
		padding: 0;
		max-width: 240px;
	}

	@media (min-width: 640px) {
		main {
			padding: 0 1em;
			max-width: none;
			margin: 0 auto;
		}
	}
</style>

<main>
	<Router {routes} />
</main>

