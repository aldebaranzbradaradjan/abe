<script>
  export let Tabs;
  export let indextab;
  export let logout;
</script>

<div class="w3-sidebar w3-bar-block w3-card">
  <br/>
  <h2 class="title">
    <img style="width:100%" src="/dashboard/admin_restricted/images/abe.webp" alt="logo" />
    <span>Abe Dashboard</span>
  </h2>

  <div
    class="fixed-center"
    style="top: calc(50% - {(Object.values(Tabs).length * 38.5) / 2}px);"
  >
    {#each Object.values(Tabs) as Tab}
      <button
        class="w3-bar-item w3-button"
        class:selected_tab={indextab === Tab}
        on:click={() => (indextab = Tab)}
      >
        <i
          class="fa fa-fw"
          class:fa-pencil={Tab === Tabs.Posts}
          class:fa-list={Tab === Tabs.Categories}
          class:fa-bar-chart={Tab === Tabs.Statistics}
          class:fa-asterisk={Tab === Tabs.Others}
        />
        {Tab}
      </button>
    {/each}
  </div>

  <button class="w3-bar-item w3-button fixed-bottom" on:click={logout}>
    <i class="fa fa-fw fa-sign-out "/> Logout
  </button>
</div>

<style>

  .title {
    text-align: center;
  }

  .w3-sidebar {
    background-color: antiquewhite;
    width: 200px;
    color: var(--darker-grey) !important;
    background-color: var(--light-grey) !important;
    z-index: 0;
  }

  .selected_tab,
  .selected_tab:hover {
    background-color: var(--blue) !important;
    color: var(--cream) !important;
  }

  .fixed-center {
    position: absolute;
    width: 100%;
    top: 50%;
    padding-top: -2%;
  }

  .fixed-bottom {
    position: absolute;
    width: 100%;
    bottom: 0;
  }
</style>
