<script>	
import { onMount, onDestroy } from 'svelte';
import Router from 'svelte-spa-router';

import Total from './pages/Total.svelte';
import State from './pages/State.svelte';

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
		margin: 0 auto;
		max-width: 360px;
	}

	@media (min-width: 640px) {
		main {
			padding: 0 1em;
			max-width: none;
		}
	}
</style>

<main>
	<Router {routes} />
</main>

