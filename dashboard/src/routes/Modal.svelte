
<script>
	import { fade } from 'svelte/transition';
	export let show;
</script>

{#if show}
	<div class="modal-background" on:click={()=>{ show = false }} out:fade in:fade></div>

	<div class="w3-modal-content w3-card-4 modal-content" out:fade in:fade>

		<div class="w3-center">
			<h2 class="title"><slot name="title"></slot></h2>
		</div>

		<form class="w3-container">
			<div class="w3-section">
				<slot></slot>
			</div>
		</form>

		<div class="w3-container w3-border-top w3-padding-16 w3-light-grey">
			<button class="w3-button w3-blue round" on:click={()=>{ show = false }}>Cancel</button>
			<slot name="button"></slot>
		</div>

	</div>
{/if}

<style>

	.modal-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0,0,0,0.7);
		z-index: 10;
	}

	.modal-content {
		width: 500px;
		position: fixed;
		top: 25%;
		left: 50%;
		margin-left: -250px;
		z-index: 10;
	}

	.w3-modal-content {
		border-radius: 5px;
	}

	.w3-section {
		text-align: center;
	}

	.w3-container {
		border-radius: 0 0 5px 5px;
	}

	.title {
		padding-top: 8px;
	}

	.round {
		border-radius: 5px;
	}

</style>
