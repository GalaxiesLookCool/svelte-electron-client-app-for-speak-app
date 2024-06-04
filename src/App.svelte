<script>
	import MainChat from './MainChat.svelte';
	import Login from './Login.svelte'
	import {msgs, groups, token, global_styling_font_family} from './store.js'
</script>

<svelte:head>
	<script src="MediaStreamRecorder.js"> </script>
	<style>
		.noscrollbar::-webkit-scrollbar {
			display: none;
		}
	</style>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Protest+Revolution&display=swap" rel="stylesheet">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Protest+Revolution&family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">


</svelte:head>


<main>
	<div style={$global_styling_font_family}>
		{#if $token.length == 20}
			<MainChat></MainChat>
		{:else}
			<Login ></Login>
		{/if}
	</div>
	
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
	body {
		font-family: "Protest Revolution", sans-serif;
  		font-weight: 400;
  		font-style: normal;
	}
</style>