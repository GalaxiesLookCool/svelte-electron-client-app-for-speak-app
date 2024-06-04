<script>
    import {get_all_users, id} from './store'
    import { get } from 'svelte/store';
    import { fade, blur, fly, slide, scale, draw, crossfade } from 'svelte/transition'
    export let userAction;
    export let toNotShow = []
    let filterText;
    let users_showed = []
    let users_showing = []
    let filteredUsers = []
    $: find_users(filterText)
    $: filterUsers(toNotShow, $id, users_showing)

    async function filterUsers(tonotshowarray, userid, main_data_array){
      /*
      function that recieves a list of users to not show, your userid, and all users list, and filters it and saves in filteredUsers list
      */
        filteredUsers = []
        let udata = null
        for (var i = 0; i < main_data_array.length; i++){
            udata  = main_data_array[i]
            if (udata["id"] != userid && !tonotshowarray.includes(udata["id"])){
                filteredUsers.push(udata)
            }
        }
        filteredUsers = filteredUsers
    }

    async function find_users(filter){
      /*
      function that is run when filter is changed, and fetches all users that match the filter
      */
        let new_users = await get_all_users(filter)
        if (new_users["status"] == "success")
            users_showing = new_users["success_data"]
        else
            window.api.notify("error in fetching users of filter")
    }
</script>

<div class="search-container flex flex-col w-full">
  <input type="text" bind:value={filterText} placeholder="search user" class="search-input px-4 py-2 border border-purple-200 rounded-md mb-4 focus:ring-2 focus:ring-purple-300 transition ease-in-out duration-300" />
  <div class="user-list flex flex-col gap-2">
    {#each filteredUsers as user_data}
      <button on:click={() => userAction(user_data.id)} class="user-item text-left w-full flex items-center justify-between bg-gray-100 hover:bg-purple-100 rounded-md px-4 py-2 cursor-pointer transform hover:scale-105 transition duration-300 ease-in-out">
        <span class="w-52 truncate ... user-name text-purple-500 font-bold">{user_data.uname}</span>
        <span class="truncate ... user-email text-gray-500">{user_data.email}</span>
      </button>
    {/each}
    {#if !filteredUsers.length}
      <div class="no-results text-center text-gray-500 font-italic">no users found</div>
    {/if}
  </div>
</div>
