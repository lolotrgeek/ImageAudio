function loadCanvas() {
    var canvas = document.getElementById('canvas');
    var ctx = c.getContext("2d");
    var video = document.getElementById('video');

    video.addEventListener('play', function() {
        var $this = this; //cache
        (function loop() {
        if (!$this.paused && !$this.ended) {
            ctx.drawImage($this, 0, 0);
            setTimeout(loop, 1000 / 30); // drawing at 30fps
            setInterval(getImageData(canvas,ctx), 1000 / 30 ); // encode at 30 fps  
        }
        })();
    }, 0);
}

function getImageData(canvas,ctx) {    
    var srcImgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var height = srcImgData.height;
    var width = srcImgData.width;
    console.log ('Loading Canvas...' + width + height);

    var durationSeconds = .05; // can be decimal (float)
    var tmpData = [];
    var maxFreq = 0;
    var data = [];
    var sampleRate = 44100; // 1 second
    var channels = 1;
    var numSamples = Math.round(sampleRate * durationSeconds);
    var samplesPerPixel = Math.floor(numSamples / width);
    var maxSpecFreq = 20000;
    var C = maxSpecFreq / height;
    var yFactor = 2;

    for (var x = 0; x < numSamples; x++) {
        var rez = 0;
        var pixel_x = Math.floor(x / samplesPerPixel);

        for (var y = 0; y < height; y += yFactor) {
            var pixel_index = (y * width + pixel_x) * 4;
            var r = srcImgData.data[pixel_index];
            var g = srcImgData.data[pixel_index + 1];
            var b = srcImgData.data[pixel_index + 2];

            var s = r + b + g;
            var volume = Math.pow(s * 100 / 765, 2);

            var freq = Math.round(C * (height - y + 1));
            rez += Math.floor(volume * Math.cos(freq * 6.28 * x / sampleRate));
        }

        tmpData.push(rez);

        if (Math.abs(rez) > maxFreq) {
            maxFreq = Math.abs(rez);
        }
    }
    for (var i = 0; i < tmpData.length; i++) {
        console.log('Encoding...' + tmpData[i]);
        data.push(32767 * tmpData[i] / maxFreq); //32767
        
    }
    
    var wave = new RIFFWAVE();
    wave.header.sampleRate = sampleRate;
    wave.header.numChannels = channels;
    wave.header.bitsPerSample = 8;
    wave.Make(data);
    //var tBlob = dataURItoBlob(wave.dataURI);
    //saveAs(tBlob, 'result.wav');

    console.log('Playing...')

    var audio = new Audio();    // Create <audio> tag
    audio.src=wave.dataURI;
    audio.play();
}

function dataURItoBlob(dataURI) {
// convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);
// separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
// write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {type: mimeString});
}