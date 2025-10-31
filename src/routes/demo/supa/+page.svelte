<script>
	let { data } = $props();
</script>

<ul>
	{#each data.car_make as make}
		<li>{make.name}</li>
	{/each}
</ul>
<style>
    ul {
        list-style-type: disc;
        padding-left: 1.5rem;
    }  
    li {
        margin-bottom: 0.5rem;
    }
</style>