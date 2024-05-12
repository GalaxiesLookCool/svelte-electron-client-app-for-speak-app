<script>
    import { onMount } from 'svelte'
    export let audioSrc;
    import WaveSurfer from 'wavesurfer.js';
    let playing = false;
    let wavesurfer;
    $: tryLoadSrc(audioSrc)

    function tryLoadSrc(audiosrc){
        console.log("audio src changed")
        if (!wavesurfer || !audioSrc)
            return
        wavesurfer.load(audioSrc)//.then(()=>{
        //    wavesurfer.seekTo(1)
        //})
    }
    onMount( async () => {
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#4F4A85',
            barWidth: 2,
            /** Spacing between bars in pixels */
            barGap: 1,
            /** Rounded borders for bars */
            barRadius: 50,/** A vertical scaling factor for the waveform */
            barHeight: 3,
            //minPxPerSec : 100,
            //hideScrollbar: true,
            height: 40,
            width: 288,
            progressColor: '#383351',
            url : audioSrc,
        })
        wavesurfer.on('finish', ()=>{
            playing=false;
        })
    })

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="flex flex-row h-12 w-80 rounded-lg bg-gray-200" >
    <div id="waveform" class="overflow-hidden" on:click={()=>{if (playing){
        return
    }
    playing = true;
    wavesurfer.play()}}>

    </div>
</div>