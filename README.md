# noisetab
Chrome extension that puts minimalistic audio visualizations in New Tab.

![screenshot](https://cl.ly/2a0l1w3A3j3v/download/Screen%20Shot%202017-03-25%20at%203.38.46%20AM.png)

[Download from Chrome Store](https://chrome.google.com/webstore/detail/noisetab/kneigdgmcokiokbcdlcahgpdjhimkckj)

## How it works?

This extension overrides Chrome's New Tab URL and loads `tab.html` in it. The page creates an audio stream from user's microphone or any other user input provided by the user, uses it as a source for WebAudio's AnalyserNode to get realtime frequency data, and paints it on the canvas.

Much of the code is forged from [https://github.com/mdn/voice-change-o-matic](https://github.com/mdn/voice-change-o-matic) and modified as needed.

### About Audio Inputs

This relies on `getUserMedia` to get the audio input, which means you can either feed microphone input or any other real sound inputs. In order to use system output directly, you will need to use a software based audio routing tool.

On Mac OS, one can use [Loopback](https://rogueamoeba.com/loopback/). For other platforms, suggestions are welcome as pull requests.

## License
MIT
