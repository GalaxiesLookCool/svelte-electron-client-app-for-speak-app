<script>
  import { DropdownMenu } from "bits-ui";
  import { get } from "svelte/store";
  import { lazyLoad } from "./lazyLoad.js";
  import { users, download_file, download_image, edit_msg } from "./store.js";
  import { scale, slide, fade, blur, fly } from 'svelte/transition'
  import { onMount } from "svelte";
  import {clickOutside} from './clickOutside.js';
  //import WaveSurfer from 'https://unpkg.com/wavesurfer.js@7/dist/wavesurfer.esm.js'
  export let textContent;
  export let msgSender;
  export let timeSent;
  export let attachments;
  export let msgid;
  export let changeaudio;
  export let read_receipts;
  export let group_id;
  export let msg_type;
  export let last_edited;
  //export let read_receipts = [];
  let readMenu = false;
  let attached = false;
  let waveDicts = {};
  let hovered = false;
  let editing = false;
  let textareaediting = null;
  let audioLengths = {};
  import { id, delete_msg } from "./store.js";
  $: directionClass = msgSender.id == get(id) ? "flex-row-reverse" : "flex-row";
  $: justifyClass = msgSender.id == get(id) ? "justify-end" : "justify-start";
  $: colorClass = msgSender.id == get(id) ? "bg-blue-300" : "bg-purple-300";
  $: tryDisplayWaveform(attachments);
  async function tryDisplayWaveform(attachments) {
    /*
    function that recieves the attachments  list, and if there is a voice recording attachments, displays it
    */
    if (!attached) return;
    attachments.forEach((attach, index) => {
      if (attach.type == "audiorecording") {
        if (
          document.getElementById("msg" + msgid + "_recording").innerHTML != ""
        )
          return;
        const wavesurfer = WaveSurfer.create({
          container: "#msg" + msgid + "_recording",
          waveColor: "#4F4A85",
          progressColor: "#383351",
          url: attach.data,
          barWidth: 3,
          barGap: 3,
          barRadius: 100,
          barHeight: 1.3,
          height: 50,
          width: 200,
          cursorColor: "#ddd5e9",
        });
        wavesurfer.on("interaction", () => {
          changeaudio(wavesurfer);
          wavesurfer.play();
        });
        waveDicts[index] = wavesurfer;
        audioLengths[index] = 0
        wavesurfer.on("ready", (dur)=>{
          audioLengths[index] = dur
        })
      }
    });
  }

  onMount(async () => {
    var loc = window.location.pathname;
    attached = true;
    tryDisplayWaveform(attachments);
  });
  function textAreaAdjust() {
    /*
    function that readjusts the text field to the number of lines
    */
    let element = textareaediting
    element.style.height = "1px";
    element.style.height = (25+element.scrollHeight)+"px";
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div
  class="flex flex-col rounded-lg p-3 {justifyClass}"
  on:mouseenter={() => (readMenu = true)}
  on:mouseleave={() => (readMenu = false)}
  id={"msg_" + msgid}
>
  <div class="flex {directionClass} items-center" on:mouseenter={()=>{hovered = true}} on:mouseleave={()=>{hovered = false}} >
    <!-- if all values in read_receipts arent null, show blue checkmark, else show gray checkmark-->
    
    <!-- svelte-ignore a11y-img-redundant-alt -->
    <div
      class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500"
    >
      <img alt="Group Image" class="h-9 w-9 rounded-full" src={msgSender.PFP} />
    </div>

    <div
      class="relative ml-3 mr-3 rounded-xl {colorClass} px-4 py-2 text-sm shadow w-96 break-words"
    >
      {#if msg_type=="deleted"}
        <div class="flex items-center space-x-2 rtl:space-x-reverse">
          <span class="w-36 truncate ... text-sm font-semibold text-gray-900 dark:text-white"
            >{msgSender.Name}</span
          >
          <span class="text-sm font-normal text-gray-500 dark:text-gray-400"
            >{new Date(parseInt(timeSent)).toLocaleString()}</span
          >
        </div>
        <div class="italic">THIS MESSAGE WAS DELETED</div>
      {:else}
        {#if msgSender.id == get(id)}
          <DropdownMenu.Root>
            <div class="w-6 h-6 absolute top-1 left-1 ">
              <DropdownMenu.Trigger transition={scale}>
                <div class={"rounded-full w-6 h-6  text-center" + ((hovered) ? "opacity-100" : "text-opacity-0 opacity-0 border-transparent bg-transparent")}>
                  •••
                </div>
              </DropdownMenu.Trigger>
            </div>
          <DropdownMenu.Content transition={scale} class=" border-2 border-black bg-white w-60 h-20 rounded-lg">
            <DropdownMenu.Item on:click={()=>{delete_msg(msgid, group_id)}} class="w-60 h-10 rounded-lg hover:bg-blue-300">
              <div class="cursor-pointer w-60 h-10 p-1">
                <span class="w-52 h-10">Delete this message</span>
                <span class="ml-8 w-8 h-10">🗑</span>
              </div>
            </DropdownMenu.Item>
            <DropdownMenu.Item on:click={()=>{editing = true}} class="w-60 h-10 rounded-lg hover:bg-blue-300">
              <div class="cursor-pointer w-60 h-10 p-1">
                <span class="w-52 h-10">Edit this message</span>
                <span class="ml-12 w-8 h-10">✎</span>
              </div>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        {/if}
        <div class="flex items-center space-x-2 rtl:space-x-reverse">
          <span class="w-36 truncate ... text-sm font-semibold text-gray-900 dark:text-white"
            >{msgSender.Name}</span
          >
          <span class="text-sm font-normal text-gray-500 dark:text-gray-400"
            >{new Date(parseInt(timeSent)).toLocaleString()}</span
          >
        </div>
        {#if editing}
          <textarea on:keypress={async (e)=>{if (e.charCode == 13){
            await edit_msg(msgid, group_id, textContent)
            editing = false
          }}} on:click_outside={async ()=>{await edit_msg(msgid, group_id, textContent); editing=false}} class="resize-none bg-transparent border-2 border-black rounded-lg w-full" on:keyup={textAreaAdjust} bind:this={textareaediting} style="overflow:hidden" bind:value={textContent} use:clickOutside ></textarea>
        {:else}
          <div>{textContent}</div>
        {/if}
        {#each attachments as attach, i (i)}
          {#if attach["type"] == "imbed-image"}
            <button
              on:click={() => {
                download_image(attach["source"]);
              }}
            >
              <img
                use:lazyLoad={attach["source"]}
                class="h-40 border-black border-2"
                alt="attachment"
              />
            </button>
          {:else if attach["type"] == "file"}
            <div class="flex items-center space-x-2">
              <button
                class="btn btn-primary bg-gray-400 rounded-lg"
                on:click={() =>
                  window.api.downLoadFileName([
                    attach["real_name"],
                    attach["hash_name"],
                  ])}
              >
                <div class="flex flex-row pl-2 py-2 px-2">
                  <img
                    alt="attachment button"
                    class="flex h-10 w-14 px-2 w-1 items-center justify-center"
                    src={(function () {
                      let attach_seperated = attach["real_name"].split(".");
                      let attach_last =
                        attach_seperated[attach_seperated.length - 1];
                      if (attach_seperated.length <= 1)
                        return "../public/filelogos/other_file_icon.png";
                      switch (attach_last) {
                        case "png":
                          return "./filelogos/image_file_icon.png";
                        case "pdf":
                          return "./filelogos/pdf_file_icon.png";
                        default:
                          return "./filelogos/other_file_icon.png";
                      }
                    })()}
                  />
                  <div class="flex justify-center items-center">
                    <span class="flex m-2">{attach["real_name"]}</span>
                  </div>
                </div>
              </button>
            </div>
          {:else if attach["type"] == "audiorecording"}
            <div
              class="flex flex-row align-middle flex items-center justify-center"
            >
              <div
                id="msg{msgid}_recording"
                class="flex h-20 w-60 bg-gray-200 border-2 border-gray-700 px-4 align-middle flex items-center justify-center"
                style="border-radius: 200px;"
              ></div>
              <div class="mx-2 text-lg">
                {Math.floor(audioLengths[i] / 60)} : {Math.floor(audioLengths[i] % 60)}
              </div>
              <button
                class="h-8 w-8 rounded-full p-1 flex border-2 border-black bg-white mx-2"
                on:click={() => {
                  waveDicts[i].playPause();
                }}
              >
                <img src="play-and-pause-button.png" alt="play or pause button" />
              </button>
            </div>
          {/if}
        {/each}
        {#if Object.values(read_receipts).every((r) => r !== 0)}
        <span in:scale={{ duration: 400 }} class="text-green-700 text-lg font-extrabold text-opacity-75">
          ✓✓
        </span>
        {:else}
        <span in:scale={{ duration: 400 }} class="text-blue-700 text-lg font-extrabold text-opacity-75">
          ✓
        </span>
        {/if}
        {#if last_edited != null}
          <span class="text-sm font-normal text-gray-500 dark:text-gray-400"
            >Last edited at {new Date(parseInt(last_edited) * 1000).toLocaleString()}</span
            >
         {/if} 
      {/if}
    </div>
  </div>
</div>
