<script>
    import {msgs, groups, token, users, addUser, sortGroups, addUsersOfGroup, sortMsgs, fetch_groups, fetch_msgs, send_message, server_update, current_group, clear_msgs } from './store.js'
    let activeGroup = null;
    import Sidebar from './Sidebar.svelte'
    import MsgsHolder from './MsgsHolder.svelte';
    import { get } from 'svelte/store';
    let clearMsgsForm;
    let scrollToBott;


    window.api.serverUpdate(server_update)


    fetch_groups()

    const changeChat = (newChatID) => {
        /*
        function that does everything needed when changing the selected chat - colors it blue, clears out all old messages, and fetches the messages
        */
        activeGroup = newChatID
        clearMsgsForm()
        clear_msgs()
        var tempGroups = get(groups)
        current_group.set(newChatID)
        for (var i = 0; i < get(groups).length; i++){
            if (tempGroups[i]["id"] == newChatID){
                tempGroups[i]["selected"] = true 
                fetch_msgs(newChatID).then((resp) => {
                    if (resp.status == "error"){
                        window.api.notify(resp.error_msg)
                        //alert(resp.error_msg)
                    }
                    else {
                        scrollToBott()
                    }
                })
            }
            else {
                tempGroups[i]["selected"] = false
            }
        }
        groups.set(tempGroups)
        msgs.set([])
    }

    function newGroup(_,data) {
        /*
        function that executes whenever there is a new group. NOT USED!!
        */
        groups.set([...get(groups), {"name" : data["CHATNAME"], "id" : data["CHATID"], "membersDict" : data["memberstatus"], "picture" : data["picture"], "selected" : false, "unread" : 0}])
        sortGroups()
    }

    function sendMessage(textContent, messageAttachmentsArray){
        /*
        function that recieves the text content and attachments array, sends the message, clears the text form, and handles the response
        */
        if (textContent.length == 0 && messageAttachmentsArray.length == 0){
            return;
        }
        /*
        var msgDict = {"type" : "NEWMSGFROMCLIENT", "TIMESENT" : Date.now(), "MSGTYPE" : "NORMALMSG", "TEXTCONTENT" : textContent, "CHATID" : activeGroup, "token" : $token, "ATTACHMENTS" : messageAttachmentsArray}
        window.api.promiseMsg(JSON.stringify(msgDict)).then((resp) => {
            if (JSON.parse(resp)["success"] == "0")
                alert(JSON.parse(resp)["errorMsg"])
        })
        */
        send_message(textContent, activeGroup, messageAttachmentsArray).then((resp) => {
            if (resp["status"] == "error"){
                window.api.notify("failed to send error")
                //alert("failed to send error")
            }
            scrollToBott()
        })
        clearMsgsForm()
    }

    function newMsg(_, data) {
        /*
        UNUSED
        */
        if (activeGroup == data["CHATID"]){
            var tempMsgDict = {"textcontent" : data["textcontent"] , "msgid" : data["msgid"], "CHATID" : data["CHATID"], "senderid" : data["senderid"], "usersReadStatus" : data["usersReadStatus"], "timeSent" : data["timeSent"], "attachments" : data["attachments"], "msgtype" : data["msgtype"]}
            msgs.set([...get(msgs), tempMsgDict])
            sortMsgs()
            scrollToBott()
        }
        for (var i = 0; i < $groups.length; i++){
            if ($groups[i].id == data["CHATID"])
                $groups[i]["latestMsg"] = {"time" : data["timeSent"], "content" : data["textcontent"]}
        }
        sortGroups()
    }

    window.api.customNewGroup(newGroup)
    window.api.msgCB(newMsg)
</script>

<div class="flex h-screen text-gray-800 antialiased">
    <div class="flex h-full w-full flex-row overflow-x-hidden">
        <Sidebar groupsProp={$groups} changeChat={changeChat} users={$users}></Sidebar>
        <MsgsHolder changeChat={changeChat} activeGroup={activeGroup} bind:clearForm={clearMsgsForm} bind:scrollToBottom={scrollToBott} msgs={$msgs} sendMessage={sendMessage} users={$users} isActive={activeGroup == null ? false : true}></MsgsHolder>
    </div>
</div>

<!--<div class="flex h-full flex-auto flex-col p-6">-->