<script>
    import {msgs, groups, token, id, try_login, try_register} from './store.js'
    import defaultimage from './defaultimage.js'
    let regOrLogin = 0
    let name = "";
    let password = "";
    let email = "";
    let files;
    let errorBox;
    let errorMsg;
    let imageBox;
    let imageB64 = "";
    let imageErrorBox;

    function tryShowImage(event){
      var file = event.target.files[0]
      console.log(file)
      if (["png" , "jpeg", "jpg"].includes(getExtension(file))){
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = function(){
          if (errorMsg.innerHTML == "not an image!"){
            errorBox.classList.add("hidden")
          }
          imageBox.src = reader.result
          imageBox.parentElement.parentElement.classList.remove("hidden")
          imageB64 = reader.result
        }
      }
      else {
        imageB64 = ""
        imageBox.parentElement.parentElement.classList.add("hidden")
        errorBox.classList.remove('hidden')
        errorMsg.innerHTML = "not an image!"
      }
    }

    function getExtension(file) {
      console.log(file)
        var filename = file.name
        if (filename){
            var parts = filename.split('.');
            return parts[parts.length - 1];
        }
        return ""
        
    }
    const tryReg = function(){
        console.log("this ran")
        console.log(`name - ${name} password - ${password}`)
        var emailRegex = new RegExp("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}")
        if (emailRegex.test(email) == false){
          console.log("email invalid")
            errorBox.classList.remove('hidden')
            console.log(errorBox)
            console.log(errorBox.style.display)
            
            errorMsg.innerHTML = "email is invalid!"
            return
        }
        var unameRegex = new RegExp("^[a-zA-Z]+")
        if (unameRegex.test(name) == false){
            console.log("uname invalid")
            errorBox.classList.remove('hidden')
            console.log(errorBox)
            console.log(errorBox.style.display)
            
            errorMsg.innerHTML = "Username Must be at least 1 char, and only contain english letters"
            return
        }
        var passwordRegex = new RegExp("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$")
        if (passwordRegex.test(password) == false){
            console.log(`password invalid - ${password}`)
            errorBox.classList.remove('hidden')
            errorMsg.innerHTML = "Password must contain at least one upper char, one special char, one lower char, and in total at least 8 chars"
            return;
        }
        //var msg = {"type" : "SIGNUP", "email" : email ,"uname" : name, "pswd" : password}
        //msg["pfp"] = (imageB64.length > 0) ? imageB64 : defaultimage
        try_register(email, name, password, imageB64.length > 0 ? imageB64 : null).then((resp) => {
          if (resp.status == "success"){
            regOrLogin = 1
          }
          else {
            errorBox.classList.remove('hidden')
            errorMsg.innerHTML = `error in registering - ${resp.error_msg}`
          }
        })
        
    }

    const tryLogin = ()=> {
      //var loginMsg = {"type" : "LOGIN", "email" : email, "pswd" : password}
      //var loginMsg = make_login_message(email, password)
      try_login(email, password).then((resp) => {
        if (resp.status == "error") {
          errorBox.classList.remove('hidden')
          errorMsg.innerHTML = `error in logging in - ${resp.error_msg}`
        }
      })
    }

</script>
    
{#if regOrLogin == 0}

  <div class="flex h-screen items-center justify-center bg-gray-100">
      <div class="bg-pur w-96 rounded-lg bg-purple-300 p-8 text-center shadow-lg">
        <h1 class="mb-8 text-4xl font-bold text-blue-700">Sign Up</h1>
        <form>
          <div class="relative mb-6" data-te-input-wrapper-init>
            <input bind:value={email}   type="text" class="peer block min-h-[auto] w-full rounded-lg border-0 bg-transparent bg-white px-3 py-[0.32rem] leading-[2.15] text-black outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-neutral-200 dark:placeholder:text-neutral-200 [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0" id="exampleFormControlInput3" placeholder="Email address" />
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="peer-placeholder-shown:text-blue-gray-500 peer-disabled:peer-placeholder-shown:text-blue-gray-500 before:content[' '] after:content[' '] pointer-events-none absolute -top-0 left-0 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mr-1 before:mt-[6.5px] before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:transition-all after:pointer-events-none after:ml-1 after:mt-[6.5px] after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.25] peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-disabled:text-transparent">Email</label>
          </div>

          <div class="relative mb-6" data-te-input-wrapper-init>
            <input bind:value={name}   type="text" class="peer block min-h-[auto] w-full rounded-lg border-0 bg-transparent bg-white px-3 py-[0.32rem] leading-[2.15] text-black outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-neutral-200 dark:placeholder:text-neutral-200 [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0" id="exampleFormControlInput3" placeholder="Username" />
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="peer-placeholder-shown:text-blue-gray-500 peer-disabled:peer-placeholder-shown:text-blue-gray-500 before:content[' '] after:content[' '] pointer-events-none absolute -top-0 left-0 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mr-1 before:mt-[6.5px] before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:transition-all after:pointer-events-none after:ml-1 after:mt-[6.5px] after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.25] peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-disabled:text-transparent">Username</label>
          </div>

          <div class="relative mb-6" data-te-input-wrapper-init>
            <input bind:value={password}   type="password" class="peer block min-h-[auto] w-full rounded-lg border-0 bg-transparent bg-white px-3 py-[0.32rem] leading-[2.15] text-black outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-neutral-200 dark:placeholder:text-neutral-200 [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0" id="exampleFormControlInput3" placeholder="********" />
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="peer-placeholder-shown:text-blue-gray-500 peer-disabled:peer-placeholder-shown:text-blue-gray-500 before:content[' '] after:content[' '] pointer-events-none absolute -top-0 left-0 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mr-1 before:mt-[6.5px] before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:transition-all after:pointer-events-none after:ml-1 after:mt-[6.5px] after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.25] peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-disabled:text-transparent">Password</label>
          </div>

          <div class="mb-2">
            <input type="file" id="image" name="image" class="hidden" accept=".jpg,.png,.jpeg" on:change={tryShowImage}/>

            <a onclick="document.getElementById('image').click()" href="#_" class="group relative mb-4 inline-flex w-full items-center justify-center overflow-hidden rounded-md border-2 border-blue-500 bg-blue-400 px-4 py-2 font-medium text-white shadow-md transition duration-300 ease-out">
              <span class="ease absolute inset-0 flex h-full w-full -translate-x-full items-center justify-center bg-blue-400 text-white duration-300 group-hover:translate-x-0">
                <svg width="20" height="20" fill="currentColor" class="mr-2" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1344 1472q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm256 0q0-26-19-45t-45-19-45 19-19 45 19 45 45 19 45-19 19-45zm128-224v320q0 40-28 68t-68 28h-1472q-40 0-68-28t-28-68v-320q0-40 28-68t68-28h427q21 56 70.5 92t110.5 36h256q61 0 110.5-36t70.5-92h427q40 0 68 28t28 68zm-325-648q-17 40-59 40h-256v448q0 26-19 45t-45 19h-256q-26 0-45-19t-19-45v-448h-256q-42 0-59-40-17-39 14-69l448-448q18-19 45-19t45 19l448 448q31 30 14 69z"></path>
                </svg>
              </span>
              <span class="ease absolute flex h-full w-full transform items-center justify-center text-white transition-all duration-300 group-hover:translate-x-full">Upload Image</span>
              <span class="invisible relative">Upload Image</span>
            </a>
          </div>
          <div class="w-full items-center justify-center flex mb-4 hidden rounded-full">
            <div class="h-64 w-64 bg-white border-4 border-black rounded-full">
              <!-- svelte-ignore a11y-missing-attribute -->
              <img bind:this={imageBox} style="border-radius:50%;"/>
              <!-- svelte-ignore a11y-missing-content -->
              <h1 bind:this={imageErrorBox}></h1>
            </div>
          </div>
          <div class="mb-2">
              <a href="#_" on:click={()=>{tryReg()}}  class="group relative mb-4 inline-flex w-full items-center justify-center overflow-hidden rounded-md border-2 border-indigo-600 bg-blue-300 px-12 py-2 text-lg font-medium text-indigo-600 hover:bg-gray-50 hover:text-white">
              <span class="duration-400 ease absolute left-0 top-1/2 block h-0 w-full bg-indigo-600 opacity-100 transition-all group-hover:top-0 group-hover:h-full"></span>
              <span class="ease absolute right-0 flex h-10 w-10 translate-x-full transform items-center justify-start duration-300 group-hover:translate-x-0">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </span>
              <span class="relative">Submit</span>
              </a>
          </div>
          <div class="mb-2">
            <a href="#_" on:click={()=>{regOrLogin = Math.abs(regOrLogin - 1)}}  class="group relative mb-4 inline-flex w-full items-center justify-center overflow-hidden rounded-md border-2 border-indigo-600 bg-blue-300 px-12 py-2 text-lg font-medium text-indigo-600 hover:bg-gray-50 hover:text-white">
            <span class="duration-400 ease absolute left-0 top-1/2 block h-0 w-full bg-indigo-600 opacity-100 transition-all group-hover:top-0 group-hover:h-full"></span>
            <span class="ease absolute right-0 flex h-10 w-10 translate-x-full transform items-center justify-start duration-300 group-hover:translate-x-0">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </span>
            <span class="relative">Switch to Login!</span>
            </a>
        </div>
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative hidden" role="alert" bind:this={errorBox}>
              <strong class="font-bold" bind:this={errorMsg}>Holy smokes!</strong>
            </div>
        
        </form>
      </div>
    </div>
{:else}
<div class="flex h-screen items-center justify-center bg-gray-100">
  <div class="bg-pur w-96 rounded-lg bg-purple-300 p-8 text-center shadow-lg">
    <h1 class="mb-8 text-4xl font-bold text-blue-700">Login</h1>
    <form>
      <div class="relative mb-6" data-te-input-wrapper-init>
        <input bind:value={email}   type="text" class="peer block min-h-[auto] w-full rounded-lg border-0 bg-transparent bg-white px-3 py-[0.32rem] leading-[2.15] text-black outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-neutral-200 dark:placeholder:text-neutral-200 [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0" id="exampleFormControlInput3" placeholder="Email address" />
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="peer-placeholder-shown:text-blue-gray-500 peer-disabled:peer-placeholder-shown:text-blue-gray-500 before:content[' '] after:content[' '] pointer-events-none absolute -top-0 left-0 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mr-1 before:mt-[6.5px] before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:transition-all after:pointer-events-none after:ml-1 after:mt-[6.5px] after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.25] peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-disabled:text-transparent">Email</label>
      </div>

      <!-- svelte-ignore a11y-label-has-associated-control -->
      <div class="relative mb-6" data-te-input-wrapper-init>
        <input bind:value={password}   type="password" class="peer block min-h-[auto] w-full rounded-lg border-0 bg-transparent bg-white px-3 py-[0.32rem] leading-[2.15] text-black outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-neutral-200 dark:placeholder:text-neutral-200 [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0" id="exampleFormControlInput3" placeholder="********" />
        <label class="peer-placeholder-shown:text-blue-gray-500 peer-disabled:peer-placeholder-shown:text-blue-gray-500 before:content[' '] after:content[' '] pointer-events-none absolute -top-0 left-0 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mr-1 before:mt-[6.5px] before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:transition-all after:pointer-events-none after:ml-1 after:mt-[6.5px] after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.25] peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-disabled:text-transparent">Password</label>
      </div>

      <div class="mb-2">
          <a href="#_" on:click={()=>{tryLogin()}}  class="group relative mb-4 inline-flex w-full items-center justify-center overflow-hidden rounded-md border-2 border-indigo-600 bg-blue-300 px-12 py-2 text-lg font-medium text-indigo-600 hover:bg-gray-50 hover:text-white">
          <span class="duration-400 ease absolute left-0 top-1/2 block h-0 w-full bg-indigo-600 opacity-100 transition-all group-hover:top-0 group-hover:h-full"></span>
          <span class="ease absolute right-0 flex h-10 w-10 translate-x-full transform items-center justify-start duration-300 group-hover:translate-x-0">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </span>
          <span class="relative">Submit</span>
          </a>
      </div>
      <div class="mb-2">
        <a href="#_" on:click={()=>{regOrLogin = Math.abs(regOrLogin - 1)}}  class="group relative mb-4 inline-flex w-full items-center justify-center overflow-hidden rounded-md border-2 border-indigo-600 bg-blue-300 px-12 py-2 text-lg font-medium text-indigo-600 hover:bg-gray-50 hover:text-white">
        <span class="duration-400 ease absolute left-0 top-1/2 block h-0 w-full bg-indigo-600 opacity-100 transition-all group-hover:top-0 group-hover:h-full"></span>
        <span class="ease absolute right-0 flex h-10 w-10 translate-x-full transform items-center justify-start duration-300 group-hover:translate-x-0">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </span>
        <span class="relative">Switch to Registering!</span>
        </a>
    </div>
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative hidden" role="alert" bind:this={errorBox}>
          <strong class="font-bold" bind:this={errorMsg}>Holy smokes!</strong>
        </div>
    
    </form>
  </div>
</div>
{/if}