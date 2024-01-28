<script>
	import MainChat from './MainChat.svelte';
	import Login from './Login.svelte'
	import {msgs, groups, token} from './store.js'
</script>

<svelte:head>
	<script src="../chatAPI/chatAPI.js" type="module"></script>
	<script src="https://cdn.webrtc-experiment.com/MediaStreamRecorder.js"> </script>
	<style>
		.noscrollbar::-webkit-scrollbar {
			display: none;
		}
	</style>
</svelte:head>

<main>
	{#if $token.length == 20}
		<MainChat></MainChat>
	{:else}
		<Login ></Login>
	{/if}

</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 1000) {
		main {
			max-width: 80rem;
		}
	}
</style>