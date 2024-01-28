<script>
    import ChatButton from "./ChatButton.svelte";
    import GroupCreateDIV from './GroupCreateDIV.svelte'
    import { fade, blur, fly, slide, scale, draw, crossfade } from 'svelte/transition'
    export let groupsProp
    export let changeChat
    let createGroupOpen = false;

    $: console.log(groupsProp)

    function test(){
        return
    }
</script>

<div class="flex w-80 flex-shrink-0 flex-col bg-white pl-6 pr-2 h-screen">
    <div class="flex flex-col h-screen">
        <div class="flex h-12 w-full flex-row items-center justify-center"></div>
        <div class="flex flex-row items-center justify-between text-xs">
            <span class="font-bold">Active Conversations</span>
            <span class="flex items-center">
                <button on:click={() => {createGroupOpen = !createGroupOpen}} class="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-white">
                <!-- svelte-ignore a11y-missing-attribute -->
                <img src="../src/creategrouplogo.png" class="rounded-full h-full w-full" />
                </button>
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