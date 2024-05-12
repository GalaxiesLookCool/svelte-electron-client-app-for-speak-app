<script>
    import { onMount } from 'svelte';
    import {send_file} from './store.js'
    export let msgs;
    export let sendMessage;
    export let isActive
    export let users
    let msgsDiv;
    let textContent = ""
    let attachmentsForm = []
    let currentImageSending;
    let imageDialog;
    let fileDialog;
    let currentFileSending = '';
    let imageInput;
    let fileInput

    let maxFileSize = 2000000000
    import MsgBubble from "./MsgBubble.svelte";

    $: scrollToBottom(msgs)

    export const clearForm = () => {
        textContent = ""
        attachmentsForm = []
    }

    export const scrollToBottom = async () => {
        console.log("should scroll")
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
            <div class="flex w-full rounded-lg bg-gray-300 py-2 align-middle">
                {#if currentFileSending.length > 0}
                    <h1>SENDIND FILE - {currentFileSending}</h1>
                {/if}
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
    <div class="flex h-full flex-auto flex-shrink-0 flex-col rounded-2xl bg-gray-100 p-4">
        <div class="mb-4 flex h-full flex-col overflow-x-auto noscrollbar" bind:this={msgsDiv}>
            {#each msgs as msg}
                <MsgBubble read_receipts={msg["read_receipts"]} textContent={msg["textcontent"]} msgSender={users[msg["senderid"]]} timeSent={msg["timesent"]} attachments={msg["attachments"]}></MsgBubble>
            {/each}
        </div>
        {#if isActive}
            <div>
                <form>
                    <label for="chat" class="sr-only">Your message</label>
                    <div class="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
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
                            <span class="sr-only">Add emoji</span>
                        </button>
                        <textarea bind:value={textContent} on:keydown={checkForEnter} id="chat" rows="1" class="block mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Your message..."></textarea>
                            <button type="button" on:click={()=>{sendMessage(textContent, attachmentsForm)}} class="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600">
                            <svg class="w-5 h-5 rotate-90 rtl:-rotate-90" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
                                <path stroke-width="6" d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z"/>
                            </svg>
                            <span class="sr-only">Send message</span>
                        </button>
                    </div>
                </form>
            </div>
        {/if}
    </div>
</div>