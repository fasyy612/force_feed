(function () {
    "use strict";
    let speech = new SpeechToText({
        key1: cfee250927b144dca5eb25c0e002439f,
        key2: de4d674458794a2180531734aaea4720,
        lang: 'en-US'
    });

    function captureAudio(initiatorTabId) {
        speech.startSpeechToText(initiatorTabId)
            .then(function (result) {
                chrome.runtime.sendMessage({
                    type: MessageTypes.SpeechInput,
                    info: result.text,
                    initiatorTabId: initiatorTabId
                });
            })
            .catch(function (result) {
                chrome.runtime.sendMessage({
                    type: MessageTypes.OnSpeechFailure,
                    info: result.errorOrigin,
                    initiatorTabId: initiatorTabId
                });
            });
    }

    // The background script will create this page and then immediately send a "CaptureAudio" message to it.
    // For that reason, it is required that this event listener be added before we exit this function.
    chrome.runtime.onMessage.addListener(function (message) {

        if (message.type === MessageTypes.OnSpeechFailure && message.info === MessageTypes.GetUserMediaError) {
            SpeechToText.closeRecorderTab();
        }

        if (message.type === MessageTypes.CaptureAudio) {
            let setUiStateToReady = function () {
                chrome.tabs.sendMessage(message.initiatorTabId, {
                    type: MessageTypes.RecorderTabClosed
                });
            };
            window.onbeforeunload = setUiStateToReady;
            captureAudio(message.initiatorTabId);
        }
    });
}());