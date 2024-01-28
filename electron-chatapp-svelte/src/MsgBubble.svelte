<script>
    import { get } from 'svelte/store';
    import { lazyLoad} from './lazyLoad.js'
    import {users, download_file, download_image} from './store.js'
    import { onMount } from 'svelte';
    //import WaveSurfer from 'https://unpkg.com/wavesurfer.js@7/dist/wavesurfer.esm.js'
    console.log(WaveSurfer)
    export let textContent;
    export let msgSender;
    export let timeSent;
    export let attachments;
    export let msgid;
    export let changeaudio
    //export let read_receipts = [];
    let readMenu = false
    let attached = false
    let waveDicts = {}
    //$: console.log(timeSent)
    //$: console.log(typeof attachments)
    import {id} from './store.js'
    $: directionClass = (msgSender.id == get(id)) ? "flex-row-reverse" : "flex-row"
    $: justifyClass = (msgSender.id == get(id)) ? "justify-end" : "justify-start"
    $: colorClass = (msgSender.id == get(id)) ? "bg-green-200" : "bg-white"
    $: tryDisplayWaveform(attachments)
    //$: console.log(attachments)
    //$: console.log(msgSender)
    async function tryDisplayWaveform(attachments){
      if (! attached)
        return
      attachments.forEach((attach, index)=>{
        if (attach.type == "audiorecording"){
          if (document.getElementById('msg' + msgid + '_recording').innerHTML != "")
            return
          console.log("trying to display waveform")
          const wavesurfer = WaveSurfer.create({
            container: '#msg' + msgid + '_recording',
            waveColor: '#4F4A85',
            progressColor: '#383351',
            url: attach.data,
            barWidth:3,
            barGap: 3,
            barRadius: 100,
            barHeight: 1.3,
            height: 50,
            width: 200,
            cursorColor: '#ddd5e9',
          })
          wavesurfer.on('interaction', () => {
            changeaudio(wavesurfer)
            wavesurfer.play()
            console.log("should play")
          })
          waveDicts[index] = wavesurfer
        }
      })
    }

    onMount(async () => {
      attached = true
      tryDisplayWaveform(attachments)
	  });
</script>

<div class="flex flex-col rounded-lg p-3 {justifyClass}" on:mouseenter={() =>readMenu = true} on:mouseleave={() =>readMenu = false}>
    <div class="flex {directionClass} items-center">
      <!-- svelte-ignore a11y-img-redundant-alt -->
      <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500"><img alt="Group Image" class="h-9 w-9 rounded-full" src={msgSender.PFP}/></div>

      <div class="relative ml-3 mr-3 rounded-xl {colorClass} px-4 py-2 text-sm shadow">
        <div class="flex items-center space-x-2 rtl:space-x-reverse">
          <span class="text-sm font-semibold text-gray-900 dark:text-white">{msgSender.Name}</span>
          <span class="text-sm font-normal text-gray-500 dark:text-gray-400">{(new Date(parseInt(timeSent))).toLocaleString()}</span>
        </div>
        <div>{textContent}</div>
        {#each attachments as attach, i (i)}
          {#if attach["type"] == "imbed-image"}
            <button on:click={() => {download_image(attach["source"])}}>
              <img use:lazyLoad={attach["source"]} class="h-40 border-black border-2" alt="attachment"/>
            </button>
          {:else if attach["type"] == "file"}
          <div class="flex items-center space-x-2">
            <button class="btn btn-primary bg-gray-400 rounded-lg" on:click={() => window.api.downLoadFileName([attach["real_name"], attach["hash_name"]])}>
              <svg class="w-40 h-40 bg-gray-700 rounded-lg  mt-4 ml-4" viewBox="0 0 20 20">
                <path d="M17.064,4.656l-2.05-2.035C14.936,2.544,14.831,2.5,14.721,2.5H3.854c-0.229,0-0.417,0.188-0.417,0.417v14.167c0,0.229,0.188,0.417,0.417,0.417h12.917c0.229,0,0.416-0.188,0.416-0.417V4.952C17.188,4.84,17.144,4.733,17.064,4.656M6.354,3.333h7.917V10H6.354V3.333z M16.354,16.667H4.271V3.333h1.25v7.083c0,0.229,0.188,0.417,0.417,0.417h8.75c0.229,0,0.416-0.188,0.416-0.417V3.886l1.25,1.239V16.667z M13.402,4.688v3.958c0,0.229-0.186,0.417-0.417,0.417c-0.229,0-0.417-0.188-0.417-0.417V4.688c0-0.229,0.188-0.417,0.417-0.417C13.217,4.271,13.402,4.458,13.402,4.688"></path>
              </svg>
              <span class="m-2">{attach["real_name"]}</span>
            </button>
          </div>
          {:else if attach["type"] == "audiorecording"}
          <div class="flex flex-row align-middle flex items-center justify-center" >
            <div id="msg{msgid}_recording" class="flex h-20 w-60 bg-gray-200 border-2 border-gray-700 px-4 align-middle flex items-center justify-center" style="border-radius: 200px;">
            </div>
            <button class="h-8 w-8 rounded-full p-1 flex border-2 border-black bg-white mx-2" on:click={()=>{
              waveDicts[i].playPause()
            }}>
              <img src="play-and-pause-button.png" alt="play or pause button"/>
            </button>
          </div>
          {/if}
        {/each}
      </div>
    </div>
</div>