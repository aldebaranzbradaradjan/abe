<script>

    let date = false;
    let category = false;
    let status = false;

    let date_from = "0001-01-01", date_to = "2021-05-06";

    let cat_nego = true;
    let cat_learn = true;
    let cat_build = true;
    let cat_combat = true;

    let status_not_pub = true;
    let status_pending = true;
    let status_pub = true;

</script>

    <div class="content">
        <h4>Date</h4>
        <div class="flex-container">
            <input type="date" bind:value={date_from}> <p>to</p> <input type="date" bind:value={date_to}>
        </div>
        
        <h4>Category</h4>
        <div class="flex-container">
            <label><input type="checkbox" bind:checked={cat_nego}> <p>Informatique</p> </label>
            <label><input type="checkbox" bind:checked={cat_learn}> <p>Learning</p> </label>
            <label><input type="checkbox" bind:checked={cat_build}> <p>Building</p> </label>
            <label><input type="checkbox" bind:checked={cat_combat}> <p>Combat</p> </label>
        </div>
        
        <h4>Status</h4>
        <div class="flex-container">
            <label><input type="checkbox" bind:checked={status_not_pub}> Not Published </label>
            <label><input type="checkbox" bind:checked={status_pending}> Pending </label>
            <label><input type="checkbox" bind:checked={status_pub}> Published </label>
        </div>
    </div>

<style>

    .content {
        background-color: white;
        border-radius: 10px;
        box-shadow: 0px 8px 8px 0px rgba(0,0,0,0.1);
        color: var(--darker-grey);
        padding: 10px;
    }

    .content h4 {
        text-align: center;
        font-size: 15px;
        line-height: 1.5;
        font-weight: bold;
    }

    .flex-container {
        display: flex;
        flex-direction: row;
        align-items:center;
        justify-content: center;
    }
    
    .flex-container * {
        margin: 5px;
    }

    label {
        display: flex;
        flex-direction: row;
        align-items:center;
        justify-content: center;
        cursor: pointer;
    }

    input {
        cursor: pointer;
    }

</style>
  