<script>
	import Router from "svelte-spa-router";
	import routes from "./routes";
</script>
  
<body>
	<Router {routes}/>
</body>


<style>

	@import "https://www.w3schools.com/w3css/4/w3.css";
	@import "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css";


	:global(:root) {
		--cream: #FEFFF8;
		--dark-cream: #d8dad3;
  		--grey: #b5bec4;
		--light-grey: #dcdfe4;
		--dark-grey: rgb(130, 135, 141);
		--darker-grey: rgb(79, 82, 87);
		--blue: #59aad9;
		--light-blue: #e8edf0;
		--dark-blue: #3077a7;
  		--green: #49F2B4;
		--yellow: #EEF272;
		--light-red: rgb(190, 100, 119);
		--red: rgb(211, 76, 132);
		--dark-red: rgb(175, 65, 111);

		--color-abstract-bg: #795576;
		--color-bg: #c8c3cc;
		--color-editor-bg: #9e8ca3;
		--color-markdown-bg: #3e373f;
		--color-markdown-text: #dfdfdf;
		--color-button-bg: rgb(129, 67, 129);
		--color-button-hover: rgb(133, 84, 133);
		--color-separator: #aaa;
	}

	:global(html, body) {
		margin:0;
		padding:0;
		height: 100vh;
	}

	:global(body) {
		background-color : white;
	}

	:global(.section) {
		height: 100%;
		box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
		border-radius: 5px;
	}

	:global(.section-header) {
		background-color: var(--blue);
		border-radius:5px 5px 0 0;
		height: 2em;
		padding: 0px;
		margin:0px;
		padding-top:0.2em;
		color: var(--cream);
		text-align: center;
		font-weight: bold;
	}

	:global(.section-body) {
		background-color: var(--cream);
		border-radius: 0 0 5px 5px;
		padding: 1em;
		height: calc(100% - 2em);
	}

	:global(.screen) {
		text-align: center;
		background-color:white;
		border-radius: 5px;
		box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
		outline:none;
	}

</style>