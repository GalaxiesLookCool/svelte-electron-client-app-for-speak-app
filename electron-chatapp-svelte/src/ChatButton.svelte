<script>
    import { get } from 'svelte/store';
    import {id, users} from './store.js'
    import { group_outros } from 'svelte/internal';
    export let value = null
    export let onClick
    let image;
    let name;
    let other_user = null
    
    $: console.log(type)
    $: console.log(value)

    //$: console.log(value)
    $: gid = value["id"]
    $: latestMsg = value["latest_msg"]
    $: type = value["typeofchat"]
    $: members = value["usersarr"]
    $: unread = value["unread"]
    $: bgColorClassNonHover = (value["selected"] == true) ? "bg-blue-300" : "bg-transparent"
    $: bgColorClassHover = (value["selected"] == true) ? "hover:bg-blue-400" : "hover:bg-gray-100"
    $: get_personal_user_data(value)

    $: if (type == "UserChat"){
        name = $users[value["usertoshow"]]["Name"]
        image = $users[value["usertoshow"]]["PFP"]
      }
      else {
        name = value["name"]
        image = value["picture"]
      }

    function get_personal_user_data(group){
      console.log(get(users))
      if (group.type == 2){
        other_user = (group.members[0] == get(id)) ? group.members[1] : group.members[0];
      }
      console.log(`other user is ${other_user}`)
    }
    $: console.log(latestMsg)
    
</script>

<button class="relative flex flex-row items-center rounded-xl p-2 my-2 {bgColorClassHover} {bgColorClassNonHover}" on:click={onClick}>
  <!-- Red circle for unread messages with the count -->
  {#if parseInt(unread) > 0}
  <div class="absolute right-2 top-1/2 flex h-4 w-4 -translate-y-1/2 transform items-center justify-center rounded-full bg-red-500 text-white">
    <!-- Replace '3' with the actual count of unread messages -->
    <span class="text-xs">{unread}</span>
  </div>
  {/if}

  <div class="flex h-8 w-8 items-center justify-center rounded-full">
    <!-- Placeholder group image -->
    <!-- svelte-ignore a11y-img-redundant-alt -->
    {#if value.type == 1}
      <img src={image} alt="Group Image" class="h-8 w-8 rounded-full border-black border-2" />
    {:else if value.type == 2}
      {#if ($users)[other_user]}
        <img src={get(users)[other_user].PFP} alt="Group Image" class="h-8 w-8 rounded-full border-black border-2" />
      {/if}
    {/if}
  </div>
  <div class="ml-2 flex flex-col">
    <div class="flex items-center">
      <div class="text-sm font-semibold">
        {#if value.type == 1}
          {name}
        {:else if value.type == 2}
          {#if ($users)[other_user]}
            {($users)[other_user].Name}
          {/if}
        {/if}
      </div>
    </div>
    {#if latestMsg}
      {#if latestMsg.textcontent.length > 15}
        <div class="text-xs text-gray-500 text-left">{latestMsg.textcontent.substring(0,15) + '..'}</div>
      {:else}
        <div class="text-xs text-gray-500 text-left">{latestMsg.textcontent}</div>
      {/if}
      <div class="text-left text-xs text-gray-500">{(new Date(parseInt(latestMsg.timesent))).toLocaleString()}</div>
    {/if}
  </div>
</button>