<script>	
import { onMount, onDestroy } from 'svelte';
import Router from 'svelte-spa-router';
import moment from 'moment';

import Header from './components/Header.svelte';
import Total from './pages/Total.svelte';
import State from './pages/State.svelte';


const routes = {
	'/': Total,
	'/sort/:sort?/:dir?': Total,
	'/state/:state': State,
	'/state/:state/sort/:sort?/:dir?': State
};

const handlerOnMount = async () => {};

onMount(handlerOnMount);
</script>
<style type="text/scss" global>
	@import "./styles/global.scss";

	main {
		text-align: center;
		padding: 0;
		margin: 0 auto;
		// max-width: 360px;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<main>
	<Header />
	<Router {routes} />
</main>

