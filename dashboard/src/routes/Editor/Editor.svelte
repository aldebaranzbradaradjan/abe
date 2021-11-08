<script>
	import { push } from "svelte-spa-router";
	import { onMount } from "svelte";
	import Modal from "../Modal.svelte";

	import init from "../../../public/ame/wasm.js";

	export let params = {};
	
	let post;
	let title;
	let abstract;
	
	let showSave = false;
	let showBack = false;


	async function save() {
		if (params.id !== null) {
			let fetch_params = {
				id: Number(params.id),
				title: title,
				abstract_: abstract,
				body: document.getElementById("textarea").value,
			};
			let response = await fetch("/api/v1/post/admin_restricted/update", {
				method: "PUT",
				headers: { "Content-Type": "application/json;charset=utf-8" },
				body: JSON.stringify(fetch_params),
			});
		}
		else {
			let fetch_params = {
				title: title,
				abstract_: abstract,
				body: document.getElementById("textarea").value,
			};
			let response = await fetch("/api/v1/post/admin_restricted/create", {
				method: "POST",
				headers: { "Content-Type": "application/json;charset=utf-8" },
				body: JSON.stringify(fetch_params),
			});
			response = await response.json();
			push("/editor/" + response);
		}
	}

	async function get_post(id) {
		let fetch_params = {
			id: Number(id),
		};

		let response = await fetch("/api/v1/post/admin_restricted", {
			method: "POST",
			headers: { "Content-Type": "application/json;charset=utf-8" },
			body: JSON.stringify(fetch_params),
		});

		post = await response.json();
		title = post.title;
		abstract = post.abstract_;

		var el = document.getElementById("textarea"); el.value = post.body;
		var evt = document.createEvent("Events");
		var evt= new Event('input');
		el.dispatchEvent(evt);
	}

	onMount(async () => {
		await init("/dashboard/admin_restricted/ame/wasm_bg.wasm");
		if (params.id !== null) get_post(params.id);
	});
</script>

<div class="w3-bar w3-black">
	<div class="w3-bar-item w3-button" style="width:10%" on:click={() => {showBack=true;}}>
		Back to Dashboard
	</div>
	<input id="title" class="w3-bar-item w3-center" style="width:80%; background-color: var(--color-editor-bg);" type="text" placeholder="Title..." bind:value={title} />
	<div class="w3-bar-item w3-button w3-right" style="width:10%" on:click={() => {showSave=true;}}>Save</div>
</div>

<div class="w3-row flex-container">
	<textarea id="abstract" class="abstract" placeholder="Abstract..." bind:value={abstract}/>
</div>

<div class="editor">
	<!-- begin of chimerical experiment, woooohooo !! -->
	<div id="yew_editor" />
	<!-- end of chimerical experiment ? nothing is less sure -->
</div>


<Modal bind:show={showSave}>
	Do you want to save the post : <b>{ title }</b> in the editor ?
	<div slot="title">Save Post</div>
	<button
	  slot="button"
	  class="w3-button w3-blue w3-right round"
	  on:click={() => {
		save();
		showSave = false;
	  }}>Save</button
	>
  </Modal>
  
  <Modal bind:show={showBack}>
	Do you realy want to go back to the dashboard ? Unsaved changes could be lost ! 
	<div slot="title">Go Back to Dashboard</div>
	<button
	  slot="button"
	  class="w3-button w3-blue w3-right round"
	  on:click={() => {
		push("/");
	  }}>Go Back</button
	>
  </Modal>


<style>
	:global(#editor) {
		position: relative;
		margin: 0;
		padding: 0;
		height: calc(100vh - 100px - 2.6em);
	}

	:global(.scroller) {
		overflow-y: auto;
		scrollbar-color: initial !important;
		scrollbar-width: 10px;
	}

	.flex-container {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		margin: 0;
		padding: 0;
	}

	.abstract {
		height: 100%;
		resize: none;
		background-color: var(--color-abstract-bg);
		border: none;
		border-radius: 0px;
	}

	.w3-bar {
		height: 2.6em;
	}

	.w3-row {
		height: 100px;
	}

	.editor {
		height: calc(100vh - 100px - 2.6em);
	}
</style>
