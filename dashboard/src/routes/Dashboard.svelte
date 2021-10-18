<script>
  import Sidebar from './Sidebar.svelte';
  import Posts from './Posts/Posts.svelte';

  let Tabs = {
    Posts: 'Posts',
    Categories: 'Categories',
    Statistics: 'Statistics',
    Others: 'Others'
  };

	const apiLogoutURL = "http://127.0.0.1:8080/api/v1/logout";

  let indextab = Tabs.Posts;

	async function logout() {
        const response = await fetch(apiLogoutURL);
        var data = await response.text;
        window.location.href = "/dashboard/login";
	}

</script>

<Sidebar Tabs={Tabs} bind:indextab={indextab} logout={logout} />

<div class="content">

  {#if indextab === Tabs.Posts}

    <Posts Tabs={Tabs} />

  {:else if indextab === Tabs.Categories}

    <p>Work in progress !</p>

  {:else if indextab === Tabs.Statistics}

    <p>Work in progress !</p>

  {:else if indextab === Tabs.Others}

    <p>Work in progress !</p>

  {:else}

    <p>No page selected !</p>

  {/if}

</div>


<style>

  .content {
    margin-left: 200px;
    background-color: var(--grey);
    height: 100%;
    width: calc(100% - 200px);
    position: fixed !important;
    padding: 10px;
    overflow-y: auto;
  }

</style>