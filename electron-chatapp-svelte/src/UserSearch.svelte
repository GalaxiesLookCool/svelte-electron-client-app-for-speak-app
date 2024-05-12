<script>
    import {get_all_users, id} from './store'
    import { get } from 'svelte/store';
    export let userAction;
    export let toNotShow = []
    let filterText;
    let users_showed = []
    let users_showing = []
    let filteredUsers = []
    $: find_users(filterText)
    $: filterUsers(toNotShow, $id, users_showing)
    $: console.log(filteredUsers)

    async function filterUsers(tonotshowarray, userid, main_data_array){
        filteredUsers = []
        console.log(main_data_array)
        let udata = null
        for (var i = 0; i < main_data_array.length; i++){
            udata  = main_data_array[i]
            console.log(udata)
            if (udata["id"] != userid && !tonotshowarray.includes(udata["id"])){
                filteredUsers.push(udata)
            }
        }
        filteredUsers = filteredUsers
    }

    async function find_users(filter){
        let new_users = await get_all_users(filter)
        console.log(new_users)
        if (new_users["status"] == "success")
            users_showing = new_users["success_data"]
        else
            alert("error in fetching users of filter")
    }
</script>

<div class="search-container flex flex-col w-full">
  <input type="text" bind:value={filterText} placeholder="Search User" class="search-input px-4 py-2 border border-gray-300 rounded-md mb-4" />
  <div class="user-list flex flex-col gap-2">
    {#each filteredUsers as user_data}
      <button on:click={() => userAction(user_data.id)} class="user-item text-left w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 rounded-md px-4 py-2 cursor-pointer">
        <span class="user-name text-blue-500 font-bold">{user_data.uname}</span>
        <span class="user-email text-gray-500">{user_data.email}</span>
      </button>
    {/each}
    {#if !filteredUsers.length}
      <div class="no-results text-center text-gray-500 font-italic">No users found</div>
    {/if}
  </div>
</div>