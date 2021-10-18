<script>
  import { onMount } from "svelte";
  import { push } from 'svelte-spa-router'
  import DatePicker from "@beyonk/svelte-datepicker/src/components/DatePicker.svelte";
  import Modal from "../Modal.svelte";
  import PostsFilters from "./PostsFilters.svelte";

  let showFilters = false;

  let posts = [];

  let selected_post = 0;
  let page = 1;
  let page_size = 20;
  let search_text = "";

  let showDeletePost = false;
  let showPublishPost = false;
  let showEditPost = false;
  let showAddPost = false;

  let publish_datepicker;
  let can_publish = false;

  function get_post_by_id(id) {
    return posts[posts.findIndex((item) => item.id === selected_post)];
  }

  function get_local_offset() {
    var d = new Date();
    return d.getTimezoneOffset();
  }

  function get_local_from_utc(e) {
    return new Date(
      Date.parse(e) - get_local_offset() * 1000 * 60
    ).toLocaleString("en-GB");
  }

  async function search() {
    let params = {
      page: page,
      page_size: page_size,
      state: "All",
      text: search_text,
    };

    let response = await fetch("/api/v1/post/admin_restricted/list", {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify(params),
    });

    posts = await response.json();
    posts = Array.from(posts[0]);
  }

  async function deletePost() {
    let params = {
      id: selected_post,
    };
    let response = await fetch("/api/v1/post/admin_restricted/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify(params),
    });
    response = await search();
    showDeletePost = false;
  }

  async function publishPost() {
    let params = {
      id: selected_post,
      date: publish_datepicker.toISOString().slice(0, 19).replace("Z", ""),
    };
    let response = await fetch("/api/v1/post/admin_restricted/publish", {
      method: "PUT",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify(params),
    });
    response = await search();
    showPublishPost = false;
  }

  async function editPost() {
    showEditPost = false;
    push("/editor/" + selected_post);
  }

  async function addPost() {
    showAddPost = false;
    push("/editor/");
  }

  onMount(() => {
    search();
  });
</script>

<div class="flex-container">
  <input
    class=""
    style="flex-grow:1"
    type="text"
    placeholder="Search.."
    on:keypress={(e) => e.key === "Enter" && search()}
    bind:value={search_text}
  />
  <button
    class="button"
    on:click={() => {
      showFilters = !showFilters;
    }}>Show Filters</button
  >
  <i on:click={() => (showAddPost = true)} class="w3-button fa fa-plus fa-lg" />
</div>

<div hidden={!showFilters}>
  <PostsFilters />
</div>

<table>
  <thead>
    <tr>
      <th>Id</th>
      <th>Title</th>
      <th>Abstract</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>

  <tbody>
    {#each posts as item (item.id)}
      <tr>
        <!-- class:selected_post={selected_post === item.id} -->
        <td>{item.id}</td>
        <td>{item.title}</td>
        <td>{item.abstract_}</td>
        <td
          >{item.published === null
            ? "Not Published"
            : Date.parse(item.published) - get_local_offset() * 1000 * 60 < Date.now()
            ? "Published (" + get_local_from_utc(item.published) + ")"
            : "Not Yet Published (" +
              get_local_from_utc(item.published) +
              ")"}</td
        >
        <td>
          <div
            class="row_button danger"
            on:click={() => {
              selected_post = item.id;
              showDeletePost = true;
            }}
          >
            <i class="fa fa-close fa-fw" />
            <div>Delete</div>
          </div>
          <div
            class="row_button"
            on:click={() => {
              selected_post = item.id;
              can_publish = false;
              showPublishPost = true;
            }}
          >
            <i class="fa fa-share-alt fa-fw" />
            <div>Publish</div>
          </div>
          <div
            class="row_button"
            on:click={() => {
              selected_post = item.id;
              showEditPost = true;
            }}
          >
            <i class="fa fa-edit fa-fw" />
            <div>Edit</div>
          </div>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<Modal bind:show={showDeletePost}>
  Are you sure you want to delete the post : <b
    >{get_post_by_id(selected_post).title}</b
  >
  ?
  <div slot="title">Delete Post</div>
  <button
    slot="button"
    class="w3-button w3-red w3-right round"
    on:click={() => {
      deletePost();
    }}>Delete</button
  >
</Modal>

<Modal bind:show={showPublishPost}>
  <p>
    Use datepicker to choose de publication date of the post : <b
      >{get_post_by_id(selected_post).title}</b
    >.
  </p>

  <DatePicker
    format="ddd, DD MMM YYYY HH:mm"
    time={true}
    on:date-selected={(e) => {
      publish_datepicker = new Date(Date.parse(e.detail.date));
      can_publish = true;
    }}
  />

  <div slot="title">Publish Post</div>
  <button
    slot="button"
    class="w3-button w3-red w3-right round"
    disabled={!can_publish}
    on:click={() => {
      publishPost();
    }}>Publish</button
  >
</Modal>

<Modal bind:show={showEditPost}>
  Open the post : <b>{get_post_by_id(selected_post).title}</b> in the editor ?
  <div slot="title">Edit Post</div>
  <button
    slot="button"
    class="w3-button w3-blue w3-right round"
    on:click={() => {
      editPost();
    }}>Edit</button
  >
</Modal>

<Modal bind:show={showAddPost}>
  Create a new post in the editor ?
  <div slot="title">Add Post</div>
  <button
    slot="button"
    class="w3-button w3-blue w3-right round"
    on:click={() => {
      addPost();
    }}>Add</button
  >
</Modal>

<style>
  :global(.time-container) {
    padding: 0 !important;
  }

  table {
    color: var(--darker-grey);
  }

  table thead tr {
    height: 50px;
  }

  tbody {
    border-radius: 10px;
    box-shadow: 0px 8px 8px 0px rgba(0, 0, 0, 0.1);
  }

  td {
    border-bottom: 1px solid rgb(192, 192, 192);
  }

  tr:last-child td {
    border-bottom: 0;
  }

  table {
    border-spacing: 0;
    width: 100%;
  }

  table tr {
    border-radius: 10px;
  }

  table tr td {
    background-color: white;
    color: rgb(69, 69, 69);
    text-align: center;
    padding: 0px;
  }

  table tr:hover td {
    background-color: var(--blue);
    color: var(--cream);
  }

  table tr:hover {
    padding: 2px;
  }

  table tr:nth-child(1) td:first-child {
    border-top-left-radius: 10px;
  }

  table tr:nth-child(1) td:last-child {
    border-top-right-radius: 10px;
  }

  table tr:last-child td:first-child {
    border-bottom-left-radius: 10px;
  }

  table tr:last-child td:last-child {
    border-bottom-right-radius: 10px;
  }

  td {
    vertical-align: middle;
    max-width: 100px;
  }

  .row_button {
    font-size: smaller;
    display: inline-block;
    margin: 0px;
    padding: 5px;
    width: 60px;
  }

  .row_button:hover {
    background-color: var(--dark-blue);
    cursor: pointer;
    color: var(--cream);
  }

  .danger:hover {
    background-color: var(--dark-red);
    cursor: pointer;

    color: var(--cream);
  }

  .flex-container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .flex-container * {
    margin: 5px;
  }

  .w3-button {
    padding: 0.4em;
  }

  button {
    border-radius: 0;
  }

  .round {
    border-radius: 5px;
  }

  .w3-red {
    background-color: var(--dark-red) !important;
  }

  .w3-red:hover {
    background-color: #ccc !important;
  }
</style>
