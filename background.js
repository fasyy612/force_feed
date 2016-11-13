(function () {
    "use strict";
    let speech = new SpeechToText({
        key1: 'cfee250927b144dca5eb25c0e002439f',
        key2: 'de4d674458794a2180531734aaea4720',
        lang: 'en-US'
    });

    function captureAudio() {
        speech.startSpeechToText()
            .then(function (result) {
            	console.log(result.text);
            })
            .catch(function (result) {
                console.log(result.errorOrigin);
            });
    }

    captureAudio();
}());