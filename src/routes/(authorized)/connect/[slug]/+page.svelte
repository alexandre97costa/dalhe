<script>
	const rigName = 'Simracing Rig';
	const imageUrl = 'https://placehold.co/1200x675?text=Simracing+Rig';
</script>

<svelte:head>
	<title>{rigName} | Connect</title>
</svelte:head>

<main>
<!-- todo: 
 1) change this bs UI
 2) add logic to check if the user is already connected to the rig, if so redirect to rig page
 3) add logic to connect the user to the rig when they click the button
-->
	<section class="rig-card" aria-labelledby="rig-name">
		<img src={imageUrl} alt="Placeholder image of a simracing rig" />
		<h1 id="rig-name">{rigName}</h1>
		<button type="button">Connect to rig</button>
	</section>
</main>

<style>
	main {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 2rem;
		background: #f4f6f8;
		font-family: system-ui, sans-serif;
	}

	.rig-card {
		width: min(100%, 36rem);
		overflow: hidden;
		border-radius: 1rem;
		background: white;
		box-shadow: 0 1rem 2.5rem rgb(15 23 42 / 12%);
		text-align: center;
	}

	img {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		background: #e2e8f0;
	}

	h1 {
		margin: 1.5rem 1rem;
		color: #172033;
		font-size: 1.75rem;
	}

	button {
		margin: 0 1rem 1.75rem;
		padding: 0.85rem 1.5rem;
		border: 0;
		border-radius: 0.5rem;
		background: #2563eb;
		color: white;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	button:hover {
		background: #1d4ed8;
	}

	button:focus-visible {
		outline: 3px solid #93c5fd;
		outline-offset: 3px;
	}
</style>
