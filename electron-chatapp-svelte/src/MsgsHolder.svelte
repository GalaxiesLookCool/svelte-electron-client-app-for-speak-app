<script>
    import { onMount } from 'svelte';
    import WaveSurfer from 'wavesurfer.js'
    import {send_file, groups, get_group_by_id} from './store.js'
    import { get } from 'svelte/store';
    import SvelteWaveSurfer from './SvelteWaveSurfer.svelte'
    import { scale, slide, fade, blur, fly } from 'svelte/transition'
    export let msgs;
    export let sendMessage;
    export let isActive
    export let users
    export let activeGroup
    let activeGroupObject = null;
    let msgsDiv;
    let textContent = ""
    let attachmentsForm = []
    let currentImageSending;
    let imageDialog;
    let fileDialog;
    let currentFileSending = '';
    let imageInput;
    let fileInput;
    let currentGroup;
    let combinedGroupUsers = "";
    let groupInfoDrawer;
    let voiceRecorderDropdown;
    let audioSoundData = false;
    let audioChunks = []
    let secondLen = 0;
    let mediawavrec;
    let mediapcmrec;
    let volumeChunks = [];
    let isRecording = false
    let isRegularForm = true;
    let currentlyPlaying;

    $: changeToRegForm(isRecording)

    function changeToRegForm(isrecbool){
        console.log(`channging is rec bool - ${isrecbool}`)
        if (!isrecbool){
            console.log("gonna put regular form true")
            setTimeout(()=>{console.log("iunside the timeout");isRegularForm = true;
            console.log("changedregularform")},501)
            return
        }
        isRegularForm = false
    }

    function playAndStopOther(newWaveSurfer){
        if (currentlyPlaying != null)
            currentlyPlaying.stop()
        currentlyPlaying = newWaveSurfer
    }

    function print_len(arr){
        console.log(arr.length)
    }

    $: parseAudioChunks(audioSoundData)

    $: set_active_group(activeGroup);
    //$: console.log("active group is ", activeGroupObject)
    $: console.log(users)

    function set_active_group(group_id){
        combinedGroupUsers = ""
        let _active_group = get_group_by_id(group_id)
        //console.log("return is ")
        //console.log(_active_group)
        activeGroupObject = _active_group
        if (activeGroupObject == null)
            return
        for (let uid of activeGroupObject.members){
            combinedGroupUsers += users[uid].Name
            combinedGroupUsers += ", "
        }
        //console.log(combinedGroupUsers)
    }

    //$: currentGroup = getActiveGroupById($activeGroup, $groups);

    //$: console.log(currentGroup)

    //function getActiveGroupById(group_id, group_array){
    //    group_array.forEach((group, _) => {
    //        if (group.id == group_id)
    //            return group
    //    })
    //}

    let maxFileSize = 2000000000
    import MsgBubble from "./MsgBubble.svelte";

    $: scrollToBottom(msgs)

    export const clearForm = () => {
        textContent = ""
        attachmentsForm = []
        try {
            mediapcmrec.stop()
            mediawavrec.stop()
        }
        catch
        {
            ;
        }
        isRecording = false
        audioSoundData = false
        volumeChunks = []
        audioChunks = []

    }

    export const scrollToBottom = async () => {
        //console.log("should scroll")
        setTimeout( () => msgsDiv.scrollTo({ top: msgsDiv.scrollHeight, behavior: 'smooth' }), 1);
    }; 

    const checkForEnter = (event) => {
        if (event.which == 13 && !event.shiftKey){
            sendMessage(textContent, attachmentsForm)
            event.preventDefault()
        }
    }

    function getExtension(file) {
        console.log(file);
        var filename = file.name;
        if (filename) {
            var parts = filename.split(".");
            return parts[parts.length - 1];
        }
        return "";
    }

    function tryShowImage(event){
        var file = event.target.files[0];
        event.target.value = null
        console.log(event.target)
        console.log("checking file")
        if (["png", "jpeg", "jpg"].includes(getExtension(file))) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                currentImageSending = reader.result
            };
            imageDialog.show()
        } else {
            window.api.notify("not an image")
            //alert("not an image")
        }
    }

    const checkForEnterImage = (event) => {
        if (event.which == 13 && !event.shiftKey){
            imageDialog.hide()
            imageInput.files = null
            sendMessage(textContent, [{"type" : "imbed-image", "source" : currentImageSending}])
            event.preventDefault()
            currentImageSending = null
        }
    }

    function tryShowFile(file_path){
        if (file_path.length == 0){
            window.api.notify("failure to send file")
            //alert("file too big")
            return
        }
        currentFileSending = file_path
        fileDialog.show()
    }

    function checkForEnterFile(event){
        if (event.which == 13 && !event.shiftKey){
            event.preventDefault()
            trySendingFile()
        }
    }

    function trySendingFile(){
        fileDialog.hide()
        imageInput.files = null
        /*
        let file_name = currentFileSending.name
        send_file(currentFileSending).then((resp) => {
            if (resp.status != "success")
                return
            sendMessage(textContent, [{"type" : "file", "hash" : resp.success_data.file_hash, "name" : file_name}])
        })
        currentFileSending = null
        */
       let file_text = textContent
       clearForm()
       window.api.sendFilePath(currentFileSending).then((resp)=>{
        console.log(resp)
        console.log(currentFileSending)
        console.log(typeof currentFileSending)
        sendMessage(file_text, [{"type" : "file", "hash_name" : resp, "real_name" : currentFileSending[0].split('\\')[currentFileSending[0].split('\\').length - 1]}])
       })
        //TODO:
        //IMPLEMENT THE SENDING USING THE NODE.JS...
    }

    function startRecording(){
        navigator.mediaDevices.getUserMedia({audio:true},).then((stream) => {
            isRecording = true
            audioSoundData = false;
            audioChunks = []
            secondLen = 0;
            volumeChunks = [];
            let mediaWavRecorder = new MediaRecorder(stream)
            mediaWavRecorder.start(100)
            mediaWavRecorder.ondataavailable = (e) => {
                if (! isRecording)
                    return
                //console.log(e)
                audioChunks.push(e.data);
                //console.log(e.data)
                //console.log(audioChunks)
                parseAudioChunks(audioChunks)
            };
            let mediaPCMRecorder = new MediaStreamRecorder(stream);
            mediaPCMRecorder.mimeType = 'audio/pcm'
            mediaPCMRecorder.start(100)
            mediaPCMRecorder.recorderType = StereoAudioRecorder;
            mediaPCMRecorder.ondataavailable = (e) => {
                if (! isRecording)
                    return
                showVol(e)
            }
            mediawavrec = mediaWavRecorder
            mediapcmrec = mediaPCMRecorder
            console.log(mediapcmrec)
            console.log(mediawavrec)
        })
    }

    async function parseAudioChunks(audioChunks){
        //console.log("parsing chunk")
        //if (typeof audioChunks != "object")
        //    return
        //let blob = new Blob(audioChunks, { type: "audio/ogg; codecs=opus" })
        //audioSoundData = await new Promise(r => {let a=new FileReader(); a.onload=r; a.readAsDataURL(blob)}).then(e => e.target.result);
        secondLen = audioChunks.length / 10
        //console.log(audioSoundData)
        return
    }

    async function showVol(audioData){
        //console.log(audioData)
        //audioData = new Int16Array(audioData)
        let arrayBuf = await audioData.arrayBuffer()
        //console.log(arrayBuf)
        arrayBuf = new Int16Array(arrayBuf)
        //arrayBuf = new Int32Array(arrayBuf)
        let sum = 0
        for (const intData of arrayBuf){
            sum += Math.abs(intData)
        }
        //console.log(Math.sqrt(sum / arrayBuf.length))
        volumeChunks.push(Math.pow(Math.sqrt(sum / arrayBuf.length), 0.8))
        volumeChunks = volumeChunks
        //console.log(volumeChunks)
    }

</script>


<div class="flex h-full flex-auto flex-col p-6">
    <sl-dialog label="Dialog" class="dialog-overview bg-black w-min" bind:this={imageDialog} on:load={imageDialog.hide}>
        <div class="bg-white px-4 pt-5 bg-black">
            <!-- svelte-ignore a11y-missing-attribute -->
            <img src={currentImageSending} class="border-black border-2 w-full"/>
            <div class="flex w-full rounded-lg bg-gray-300 py-2 align-middle">
                <textarea bind:value={textContent} on:keydown={checkForEnterImage} id="chat" rows="1" class="mx-4 inline-block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500" placeholder="Your message..."></textarea>
                    <button type="button" on:click={()=>{imageDialog.hide();imageInput.files = null;sendMessage(textContent, [{"type" : "imbed-image", "source" : currentImageSending}]); currentImageSending = null}} class="mr-4 inline-block cursor-pointer justify-center rounded-full p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
                    <svg class="w-5 h-5 rotate-90 rtl:-rotate-90" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
                        <path d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z"/>
                    </svg>
                    <span class="sr-only">Send message</span>
                </button>
            </div>
        </div>
    </sl-dialog>
    <sl-dialog lablel="fileDialog" class="dialog-overview bg-black w-min" bind:this={fileDialog} on:load={fileDialog.hide}>
        <div class="bg-white px-4 pt-5 bg-black">
            <!-- svelte-ignore a11y-missing-attribute -->
            <div class="bg-gray-500">
                {#if currentFileSending.length > 0}
                    <h1>SENDIND FILE - {currentFileSending}</h1>
                {/if}
            </div>
            <div class="flex w-full rounded-lg bg-gray-300 py-2 align-middle">
                <textarea bind:value={textContent} on:keydown={checkForEnterFile} id="chat" rows="1" class="mx-4 inline-block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500" placeholder="Your message..."></textarea>
                    <button type="button" on:click={()=>{trySendingFile()}} class="mr-4 inline-block cursor-pointer justify-center rounded-full p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
                    <svg class="w-5 h-5 rotate-90 rtl:-rotate-90" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
                        <path d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z"/>
                    </svg>
                    <span class="sr-only">Send message</span>
                </button>
            </div>
        </div>
    </sl-dialog>
    <sl-drawer label="Group info" bind:this={groupInfoDrawer}>
        {#if isActive}
            <div class="flex flex-col w-full border-y-2 border-gray-500">
                {#each activeGroupObject.members as uid}
                    <div class="flex flex-auto flex-row w-full h-14 bg-gray-100 border-y-2 border-gray-500 py-2">
                        <div class="flex h-10 w-10 ml-4 items-center justify-center rounded-full">
                            <!-- Placeholder group image -->
                            <!-- svelte-ignore a11y-img-redundant-alt -->
                            <img src={users[uid].PFP} alt="Group Image" class="h-10 w-10 rounded-full border-black border-2" />
                        </div>
                        <div class="ml-2 flex flex-col" >
                            <div class="flex">
                                {users[uid].Name}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </sl-drawer>
    <div class="flex h-full flex-auto flex-shrink-0 flex-col rounded-2xl bg-gray-100 p-4">
        {#if isActive}
            <div class="flex flex-auto flex-row w-full h-18 py-2 border-b-2 rounded-t-2xl border-black bg-gray-200">
                <button on:click={()=>{groupInfoDrawer.show()}}>
                    <div class="flex flex-row w-full h-full">
                        <div class="flex h-10 w-10 ml-4 items-center justify-center rounded-full">
                            <!-- Placeholder group image -->
                            <!-- svelte-ignore a11y-img-redundant-alt -->
                            <img src={activeGroupObject.picture} alt="Group Image" class="h-10 w-10 rounded-full border-black border-2" />
                        </div>
                        <div class="ml-2 flex flex-col">
                            <div class="flex items-center">
                            <div class="text-sm font-semibold">{activeGroupObject.name}</div>
                            </div>
                            {#if combinedGroupUsers.length > 80}
                                <div class="text-xs text-gray-500 text-left">{combinedGroupUsers.substring(0,80) + '..'}</div>
                            {:else}
                                <div class="text-xs text-gray-500 text-left">{combinedGroupUsers}</div>
                            {/if}
                        </div>
                    </div>
                </button>
            </div>
        {/if}
        <div class="mb-4 flex h-full flex-col overflow-x-auto noscrollbar" bind:this={msgsDiv}>
            {#each msgs as msg}
                <MsgBubble changeaudio={playAndStopOther} msgid={msg["msgid"]} read_receipts={msg["read_receipts"]} textContent={msg["textcontent"]} msgSender={users[msg["senderid"]]} timeSent={msg["timesent"]} attachments={msg["attachments"]}></MsgBubble>
            {/each}
        </div>
        {#if isActive}
            <div>   
                    {#if isRecording}
                        <div in:slide={{duration : 500, delay: 600, axis: 'y'}} out:slide={{ duration : 500, axis: 'x'}} class="bg-gray-50 flex flex-row p-2 align-middle items-center">
                            {Math.floor(secondLen / 60)}:{Math.floor(secondLen % 60)}
                            <div class="flex flex-auto align-middle items-center border-1 border-gray-700 bg-gray-200" style="border-radius: 500px; height: 50px;">
                                {#each volumeChunks.slice(-50) as volBar}
                                    <div style="height: {volBar}px; width: 2px" class="bg-gray-500 rounded-full mx-px">&nbsp;</div>
                                {/each}
                                <div style="height: 2px; width:2px" class="bg-gray-500 rounded-full mx-px">&nbsp;</div>
                            </div>
                            <div class="flex flex-auto w-72">
                                <button class="rounded-full border-2 border-black bg-gray-300 w-8 h-8 m-2" on:click={()=>{
                                    console.log(mediawavrec.state)
                                    if (mediawavrec.state == "recording"){
                                        mediapcmrec.pause()
                                        mediawavrec.pause()
                                        mediawavrec=mediawavrec
                                        isRecording = false
                                    }
                                    else
                                    {
                                        mediawavrec.resume()
                                        mediapcmrec.resume()
                                        isRecording = true
                                    }
                                        
                                }}>
                                    {#if mediawavrec.state == "recording"}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="h-8 w-8" viewBox="0 0 16 16"> <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/> </svg>
                                    {:else}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="h-8 w-8" viewBox="0 0 16 16"> <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/> </svg>
                                    {/if}
                                </button>
                                <button type="button" on:click={async ()=>{sendMessage("", [{"type" : "audiorecording", "data" : await new Promise(r => {let a=new FileReader(); a.onload=r; a.readAsDataURL(new Blob(audioChunks, { type: "audio/ogg; codecs=opus" }))}).then(e => e.target.result)}]);
                                    mediapcmrec.stop()
                                    mediawavrec.stop()
                                    isRecording = false
                                    audioSoundData = false
                                    volumeChunks = []
                                    audioChunks = []
                            }} class="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
                                    <svg class="w-5 h-5 rotate-90 rtl:-rotate-90" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
                                        <path stroke-width="6" d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z"/>
                                    </svg>
                                    <span class="sr-only">Send message</span>
                                </button>
                            </div>
                        </div>
                    {:else if isRegularForm}
                        <div class="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700" out:slide={{ duration : 500, axis : 'x'}} in:slide={{duration:500, axis : 'x'}}>
                            <button type="button" on:click={()=>{document.getElementById("imageholder").click()}} class="inline-flex justify-center p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                                <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 18">
                                    <path fill="currentColor" d="M13 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM7.565 7.423 4.5 14h11.518l-2.516-3.71L11 13 7.565 7.423Z"/>
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 1H2a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z"/>
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM7.565 7.423 4.5 14h11.518l-2.516-3.71L11 13 7.565 7.423Z"/>
                                </svg>
                                <span class="sr-only">Upload image</span>
                            </button>
                            <input type="file" id="imageholder" name="image" class="hidden" accept=".jpg,.png,.jpeg" on:change={tryShowImage} bind:this={imageInput} />
                            <input type="file" id="fileholder" name="file" class="hidden" on:change={tryShowFile} bind:this={fileInput} >
                            <button on:click={()=>{window.api.getFullPath().then((path)=>{tryShowFile(path)})}} type="button" class="p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="w-5 h-5" viewBox="0 0 16 16"> <path stroke-width="6" fill-rule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z"/> <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z"/> </svg>
                                <span class="sr-only">Upload File</span>
                            </button>
                            <button on:click={()=>{startRecording()}} class="h-5 w-5 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20"><path d="M16 11c0 2.209-1.791 4-4 4s-4-1.791-4-4v-7c0-2.209 1.791-4 4-4s4 1.791 4 4v7zm4-2v2c0 4.418-3.582 8-8 8s-8-3.582-8-8v-2h2v2c0 3.309 2.691 6 6 6s6-2.691 6-6v-2h2zm-7 13v-2h-2v2h-4v2h10v-2h-4z"/></svg>
                            </button>
                            <textarea bind:value={textContent} on:keydown={checkForEnter} id="chat" rows="1" class="block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Your message..."></textarea>
                                <button type="button" on:click={()=>{sendMessage(textContent, attachmentsForm)}} class="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
                                <svg class="w-5 h-5 rotate-90 rtl:-rotate-90" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
                                    <path stroke-width="6" d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z"/>
                                </svg>
                                <span class="sr-only">Send message</span>
                            </button>
                        </div>
                    {/if}
                
            </div>
        {/if}
    </div>
</div>