<script>
    import ChatButton from "./ChatButton.svelte";
    import GroupCreateDIV from './GroupCreateDIV.svelte'
    import { fade, blur, fly, slide, scale, draw, crossfade } from 'svelte/transition'
    import {Dialog} from "bits-ui"
    import { get } from "svelte/store";
    export let groupsProp
    export let changeChat
    import {get_users_on, get_all_users, create_personal_chat, groups, id, global_styling_font_family, users, send_user_update, get_user_data} from './store.js'
    import UserSearch from './UserSearch.svelte'
    let createGroupOpen = false;
    let filterText = ""
    let previousUsers = []
    let currentUsers = [];
    let changingImage = null
    let changingName = null;
    let newImage = null;
    let userSearchDialogOpen = false
    $: try_fetch_users(filterText)

    async function try_fetch_users(flt){
      /*
      UNUSED
      */
        previousUsers = currentUsers
        currentUsers = (await get_all_users(flt))["success_data"]
    }


    function test(){
        return
    }

    function synchronizeChange(){
      /*
      function that sets the name and image in the changing info window the the current info
      */
        changingImage = ($users)[($id)].PFP
        changingName = ($users)[($id)].Name

    }

    async function tryShowImageChange(event){
      /*
      functoin that recieves the image file when onchange event of the file element is fired. tries displaying the new image
      */
      var file = event.target.files[0]
      if (["png" , "jpeg", "jpg"].includes(getExtension(file))){
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = function(){
          changingImage = reader.result
        }
      }
    }
    function getExtension(file) {
      /*
      function that recieves file object and returns its extension in lower case
      */
        if (file === undefined)
          return ""
        var filename = file.name
        if (filename){
            var parts = filename.split('.');
            return parts[parts.length - 1].toLowerCase();
        }
        return ""
        
    }

</script>

<div class="flex w-80 flex-shrink-0 flex-col bg-white pl-6 pr-2 h-screen">
    <div class="flex flex-col h-screen">
        {#if ($users) && ($users)[$id]}
            <div class="py-4 flex h-48 w-full flex-col items-center justify-center">
                <div class="my-4 h-32 w-32 rounded-full border-2 border-black bg-gray-100">
                    <img alt="your profile pic" class="h-full w-full rounded-full" src={($users)[($id)].PFP}/>
                </div>
                <div class="flex w-full h-12 text-xs break-all justify-center flex-row"><span class="truncate ...">{($users)[$id].Name}/{($users)[$id].Email}</span><span>
                    <Dialog.Root style={$global_styling_font_family} closeOnOutsideClick={false}>
                        <Dialog.Trigger on:click={synchronizeChange}>
                            🖉
                        </Dialog.Trigger>
                        <Dialog.Portal style={$global_styling_font_family}>
                            <Dialog.Overlay transition={fade} transitionConfig={{duration : 300}} class="fixed inset-0 z-50 backdrop-blur-sm"/>
                            <Dialog.Content
                            transition={scale}
                            transitionConfig={{ duration: 500 }}
                            class="text-gray-800 bg-gray-100 border-gray-300 border-2 fixed left-[50%] top-[50%] z-50 w-full max-w-[94%] translate-x-[-50%] translate-y-[-50%] rounded-lg border p-5 shadow-popover outline-none sm:max-w-[490px] md:w-full"
                          >
                            <div class="flex-col">
                              <div class="flex flex-row justify-center">
                                <div class="flex my-4 h-32 w-32 rounded-full border-2 border-gray-300 bg-gray-200">
                                  <img alt="your profile pic" class="h-full w-full rounded-full" src={changingImage} />
                                </div>
                                <input
                                  id="changeuserimageinput"
                                  type="file"
                                  class="hidden"
                                  bind:this={newImage}
                                  on:change={tryShowImageChange}
                                />
                                <button
                                  onclick='document.getElementById("changeuserimageinput").click()'
                                  class="pt-32 text-gray-800 hover:text-gray-600 focus:outline-none"
                                >
                                  🖉
                                </button>
                              </div>
                              <div class="flex flex-row w-full">
                                <div class="flex w-full">
                                  <textarea
                                    class="w-full bg-transparent border-2 border-gray-300 rounded-lg p-2 h-12 overflow-y-none overflow-none"
                                    bind:value={changingName}
                                  ></textarea>
                                </div>
                                <div class="flex"></div>
                              </div>
                              <Dialog.Close
                                class="h-10 w-full mt-8 border-2 border-gray-300 bg-purple-200 my-2 rounded-lg"
                              >
                                <button
                                  class="w-full h-full text-white bg-purple-500 hover:bg-purple-600 focus:outline-none"
                                  on:click={async () => {
                                    await send_user_update(changingImage, changingName);
                                    get_user_data($id);
                                  }}
                                >
                                  Submit
                                </button>
                              </Dialog.Close>
                            </div>
                          </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                </span></div>
            </div>
        {/if}
        <div class="flex flex-row items-center justify-between text-xs">
            <span class="font-bold">Active Conversations</span>
            <span class="flex items-center">
                <button on:click={() => {createGroupOpen = !createGroupOpen}} class="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-white">
                <!-- svelte-ignore a11y-missing-attribute -->
                <img src="../src/creategrouplogo.png" class="rounded-full h-full w-full" />
                </button>
                <Dialog.Root bind:open={userSearchDialogOpen}>
                    <Dialog.Trigger>
                        <!-- svelte-ignore a11y-missing-attribute -->
                        <button class="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-white"><img src="../src/searchuserlogo.png" class="rounded-full h-full w-full" /></button>
                    </Dialog.Trigger>
                    <Dialog.Overlay 
                    class="fixed inset-0 z-50 bg-black/80"></Dialog.Overlay>
                    <Dialog.Content transition={slide}
                    transitionConfig={{duration : 250, axis : 'x'}}
                    class="fixed left-[50%] top-[50%] z-50 w-full max-w-[94%] translate-x-[-50%] translate-y-[-50%] rounded-lg border bg-white p-5 shadow-popover outline-none sm:max-w-[490px] md:w-full">
                        <UserSearch toNotShow={[$id]} userAction={async (uid)=>{
                                                    
                            let res = await create_personal_chat(uid);
                            let to_switch_id = null
                            if (res.status == "success"){
                                to_switch_id = res["success_data"]
                                //loop over groups till group appears
                            }
                            else {
                                let current_groups = get(groups)
                                for (let i = 0; i < current_groups.length; i++){
                                    if (current_groups[i].members.length == 2 && current_groups[i].members.indexOf(uid) != -1 && current_groups[i].type == 2){
                                        to_switch_id = current_groups[i].id
                                    }
                                }
                            }
                            while (true){
                                await new Promise(r => setTimeout(r, 100));
                                let current_groups_loop = get(groups)
                                for (let i = 0; i < current_groups_loop.length; i++){
                                    if (current_groups_loop[i].id == to_switch_id){
                                        changeChat(to_switch_id)
                                        userSearchDialogOpen=false
                                        return
                                    } 
                                }
                            }
                            }
                        }></UserSearch>
                    </Dialog.Content>
                </Dialog.Root>
                
            </span>
        </div>
        {#if createGroupOpen}
            <div transition:slide={{duration: 300, axis: 'y'}}>
                <GroupCreateDIV cancelFunc={()=> {createGroupOpen = false}}></GroupCreateDIV>
            </div>
        {/if}
        <div class="-mx-2 mt-4 flex flex-col-reverse space-y-1 overflow-y-auto noscrollbar">
            {#each groupsProp as group}
                <ChatButton value={group} onClick={()=>{changeChat(group["id"])}}></ChatButton>
            {/each}
        </div>
    </div>
  
</div>
