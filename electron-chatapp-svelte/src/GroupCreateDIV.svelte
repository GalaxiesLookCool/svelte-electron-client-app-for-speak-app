<script>
    import { each } from "svelte/internal";
    import { token, get_users_on , create_group} from "./store";
    import defaultimage from './defaultimage.js'

    export let cancelFunc;
    let selectedUsers = {};
    let searchFilter = "";
    let filteredUsers = {};
    let onlineUsers = {};
    let groupName = "";
    let imageBox;
    let imageB64 = "";
    let imageErrorBox;
    let errorMsg;

    $: filteredUsers = filterDict(onlineUsers, searchFilter, selectedUsers);
    get_users_on().then((resp) => {
        if (resp["status"] == "success"){
            onlineUsers = resp["success_data"]
            console.log(onlineUsers)
        }
    })
    /*
    window.api
        .promiseMsg(JSON.stringify({ type: "FETCHUSERSON", token: $token }))
        .then((resp) => {
            var respDecoded = JSON.parse(resp);
            console.log(respDecoded);
            if (respDecoded["success"] == "0") {
                alert(
                    `error in fetching users online - ${respDecoded["errorMsg"]}`,
                    cancelFunc()
                );
            } else {
                onlineUsers = respDecoded["users"];
                console.log(onlineUsers);
            }
        });
        */
    function getExtension(file) {
        console.log(file);
        var filename = file.name;
        if (filename) {
            var parts = filename.split(".");
            return parts[parts.length - 1];
        }
        return "";
    }

    function tryShowImage(event) {
        var file = event.target.files[0];
        console.log(file);
        if (["png", "jpeg", "jpg"].includes(getExtension(file))) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                if (imageErrorBox.innerHTML == "not an image!") {
                    imageErrorBox.innerHTML = ""
                }
                imageBox.src = reader.result;
                imageBox.parentElement.classList.remove("hidden");
                imageB64 = reader.result;
            };
        } else {
            imageB64 = "";
            imageBox.parentElement.classList.add("hidden");
            imageErrorBox.innerHTML = "not an image!";
        }
    }

    const createFunc = ( )=> {
        if (groupName.length <= 0) {
            errorMsg.innerHTML = "Group name cannot be empty!"
            errorMsg.parentElement.classList.remove("hidden")
            return
        }
        var image_to_send = (imageB64.length > 0) ? imageB64 : ""
        var participants = Object.keys(selectedUsers)
        if (participants.length == 0){
            errorMsg.innerHTML = "Group must have at least one participant"
            errorMsg.parentElement.classList.remove("hidden")
            return
        }
        create_group(groupName, participants, image_to_send).then((resp) => {
            if (resp.status == "success")
                cancelFunc()
            else{
                errorMsg.innerHTML = resp["error_msg"]
                errorMsg.parentElement.classList.remove("hidden")
            }
        })

    }

    /*
    const createFunc = () => {
        var FullMsgDict = {"type" : "NEWGROUPFROMCLIENT"}
        if (groupName.length > 0) {
            FullMsgDict["GroupName"]= groupName
        }
        else {
            errorMsg.innerHTML = "Group name cannot be empty!"
            errorMsg.parentElement.classList.remove("hidden")
            return
        }
        if (imageB64.length > 0) {
            FullMsgDict["image"] = imageB64
        }
        else {
            FullMsgDict["image"] = defaultimage
        }
        FullMsgDict["LISTOFPARTICIPANTS"] = Object.keys(selectedUsers)
        FullMsgDict["token"] = $token
        window.api.promiseMsg(JSON.stringify(FullMsgDict)).then((resp) => {
            var respDecoded = JSON.parse(resp)
            if (respDecoded["success"] == "1")
                cancelFunc()
            else {
                errorMsg.innerHTML = respDecoded["errorMsg"]
                errorMsg.parentElement.classList.remove("hidden")
            }
        })
    };
    */


    function filterDict(dict, filt, secondDict) {
        var arrToFilter = Object.entries(dict);
        var filtered = arrToFilter.filter(function ([key, value]) {
            if (value.includes(filt) && !(key in secondDict)) return true;
            else return false;
        });
        filteredUsers = Object.fromEntries(filtered);
        return filteredUsers;
    }

    function addToSelected(id, name) {
        selectedUsers[id] = name;
    }

    function removeSelected(id) {
        delete selectedUsers[id];
        selectedUsers = selectedUsers;
        console.log(selectedUsers);
    }
</script>

<div class="bg-gray-100 p-4 rounded-lg">
    <div class="relative mb-6" data-te-input-wrapper-init>
        <input bind:value={groupName}   type="text" class="peer block min-h-[auto] w-full rounded-lg border-0 bg-transparent bg-white px-3 py-[0.32rem] leading-[2.15] text-black outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-neutral-200 dark:placeholder:text-neutral-200 [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0" id="exampleFormControlInput3" placeholder="Group Name" />
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="peer-placeholder-shown:text-blue-gray-500 peer-disabled:peer-placeholder-shown:text-blue-gray-500 before:content[' '] after:content[' '] pointer-events-none absolute -top-0 left-0 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mr-1 before:mt-[6.5px] before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:transition-all after:pointer-events-none after:ml-1 after:mt-[6.5px] after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.25] peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-disabled:text-transparent">Group Name</label>
    </div>
    <input
    type="file"
    id="image"
    name="image"
    class="hidden"
    accept=".jpg,.png,.jpeg"
    on:change={tryShowImage}
    />
    <div
    class="w-full items-center justify-center flex mb-4"
    >
    <div class="h-40 w-40 bg-white border-4 border-black rounded-full hidden items-center flex">
        <!-- svelte-ignore a11y-missing-attribute -->
        <img bind:this={imageBox} class="h-full w-full rounded-full" />
        <!-- svelte-ignore a11y-missing-content -->
    </div>
    <!-- svelte-ignore a11y-missing-content -->
    <h1 bind:this={imageErrorBox} hidden></h1>
    </div>
    <a
        onclick="document.getElementById('image').click()"
        href="#_"
        class="group relative mb-4 mt-4 inline-flex w-full items-center justify-center overflow-hidden rounded-md border-2 border-blue-500 bg-blue-400 px-4 py-2 font-medium text-white shadow-md transition duration-300 ease-out"
    >
        <span
            class="ease absolute inset-0 flex h-full w-full -translate-x-full items-center justify-center bg-blue-400 text-white duration-300 group-hover:translate-x-0"
        >
            <svg
                width="20"
                height="20"
                fill="currentColor"
                class="mr-2"
                viewBox="0 0 1792 1792"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M1344 1472q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm256 0q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128-224v320q0 40-28 68t-68 28h-1472q-40 0-68-28t-28-68v-320q0-40 28-68t68-28h427q21 56 70.5 92t110.5 36h256q61 0 110.5-36t70.5-92h427q40 0 68 28t28 68zm-325-648q-17 40-59 40h-256v448q0 26-19 45t-45 19h-256q-26 0-45-19t-19-45v-448h-256q-42 0-59-40-17-39 14-69l448-448q18-19 45-19t45 19l448 448q31 30 14 69z"
                ></path>
            </svg>
        </span>
        <span
            class="ease absolute flex h-full w-full transform items-center justify-center text-white transition-all duration-300 group-hover:translate-x-full"
            >Upload Image</span
        >
        <span class="invisible relative">Upload Image</span>
    </a>
    <input bind:value={searchFilter} placeholder="Search Filter" class="w-full"/>
    <div class="bg-purple-200 overflow-scroll h-48 w-full noscrollbar flex-col">
        {#each Object.entries(filteredUsers) as [id, name]}
            <div class="bg-gray-200 w-full border-black border-1">
                <button class=""
                    on:click={() => {
                        addToSelected(id, name);
                    }}>{name}</button
                >
            </div>
        {/each}
    </div>
    <div class="bg-blue-300 flex-wrap h-48 overflow-scroll noscrollbar my-2">
        {#each Object.entries(selectedUsers) as [id, name]}
            
            <button class="bg-gray-300 rounded-lg text-black font-bold px-2 max-h-10"
                on:click={() => {
                    removeSelected(id);
                }}>{name}&#x2715;</button
            >
        {/each}
    </div>
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative hidden" role="alert">
        <strong class="font-bold" bind:this={errorMsg}>Holy smokes!</strong>
      </div>
    <div class="my-4 p-1 items-center flow-root">
        <button
        on:click={cancelFunc}
        class="text-lg h-16 w-28 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg px-2 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
        >Cancel</button>
    <button
        on:click={createFunc}
        class="text-lg h-16 w-28 float-right text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg px-2 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
        >Create Group</button>
    </div>
</div>
