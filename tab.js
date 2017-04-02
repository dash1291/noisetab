// fork getUserMedia for multiple browser versions, for those
// that need prefixes
navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia);

// set up forked web audio context, for multiple browsers
// window. is needed otherwise Safari explodes
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var source;
var stream;

//set up the different audio nodes we will use for the app
var analyser = audioCtx.createAnalyser();
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;

var distortion = audioCtx.createWaveShaper();
var gainNode = audioCtx.createGain();
var biquadFilter = audioCtx.createBiquadFilter();
var convolver = audioCtx.createConvolver();

// set up canvas context for visualizer
var canvas = document.querySelector('.visualizer');
var canvasCtx = canvas.getContext("2d");

var intendedWidth = document.querySelector('.wrapper').clientWidth;

canvas.setAttribute('width',intendedWidth);

var drawVisual;

//main block for doing the audio recording
if (navigator.getUserMedia) {
   navigator.getUserMedia (
      // constraints - only audio needed for this app
      {
         audio: true
      },

      // Success callback
      function(stream) {
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.connect(distortion);
        distortion.connect(biquadFilter);
        biquadFilter.connect(convolver);
        convolver.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        chrome.storage.sync.get('visualSetting', function(items) {
          var visualSetting = items.visualSetting || 'spectrum';
          document.querySelector('#visual-setting').value = visualSetting;
          visualize(items.visualSetting || 'spectrum');
        });
      },

      // Error callback
      function(err) {
         console.log('The following gUM error occured: ' + err);
      }
   );
} else {
   console.log('getUserMedia not supported on your browser!');
}

function visualize(visualSetting) {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;

  if (visualSetting === 'circular') {
    analyser.fftSize = 512;
    var hiClip = 50;
    var loClip = 100;
    var bufferLength = analyser.frequencyBinCount - hiClip;
    var dataArray = new Uint8Array(bufferLength);
    var angularStep = (2 * Math.PI) / (bufferLength - loClip);

    function draw() {
      drawVisual = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = 'rgb(255, 255, 255)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      var barWidth = (WIDTH / bufferLength) * 0.5;
      var barHeight;
      var x = WIDTH / 2;
      var y = HEIGHT / 2;
      var angle = 0;
      var x1, y1, x2, y2;

      var steadyRadius = 150;

      const lowFreqAvg = dataArray.slice(0, loClip).reduce(function(sum, bin) {
          return sum + bin
      }) / loClip

      radius = Math.max(
        steadyRadius, lowFreqAvg + 50
      );

      var unitSize = 20/100;
      var rCos, rSin;
      canvasCtx.lineWidth = 1;

      for(var i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i + loClip] * unitSize + 1;
          rCos = Math.cos(i * angularStep);
          rSin = Math.sin(i * angularStep);
          x1 = x + ((radius - barHeight) * rCos);
          y1 = y + ((radius - barHeight) * rSin);
          x2 = x1 + (2 * barHeight * rCos);
          y2 = y1 + (2 * barHeight * rSin);

          canvasCtx.beginPath();
          canvasCtx.strokeStyle = 'rgb(' + barHeight * 12 + ', 140, 100)';
          canvasCtx.moveTo(x1, y1);
          canvasCtx.lineTo(x2, y2);
          canvasCtx.stroke();

          angle += angularStep;
      }

    };

    draw();
  } else if (visualSetting === 'oscilloscope') {
    analyser.fftSize = 2048;
    var bufferLength = analyser.fftSize;
    var maxHeight = 160;
    console.log(bufferLength);
    var dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {

      drawVisual = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(255, 255, 255)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(100, 100, 100)';

      canvasCtx.beginPath();

      var sliceWidth = WIDTH * 1.0 / bufferLength;
      var x = 0;

      for (var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * maxHeight/2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, maxHeight/2);
      canvasCtx.stroke();
    };

    draw();

  } else if (visualSetting === 'spectrum') {
    analyser.fftSize = 256;
    var maxHeight = 160;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {
      drawVisual = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = 'rgb(255, 255, 255)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      var barWidth = (WIDTH / bufferLength) * 2.5;
      var barHeight;
      var x = 0;

      for(var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        canvasCtx.fillStyle = 'rgb(' + (barHeight) + ','+ barHeight + ',' + barHeight + ')';
        canvasCtx.fillRect(x,maxHeight-barHeight/2,barWidth,barHeight/2);

        x += barWidth + 1;
      }
    };

    draw();

  } else if (visualSetting === 'off') {
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.fillStyle = 'white';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

document.querySelector('#visual-setting').onchange = function(e) {
  var visualSetting = e.target.value;
  chrome.storage.sync.set({'visualSetting': visualSetting});
  window.cancelAnimationFrame(drawVisual);
  visualize(visualSetting);
};
