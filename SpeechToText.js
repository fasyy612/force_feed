class SpeechToText {

    constructor(speechObject) {
        this.clientId = speechObject.key1;
        this.clientSecret = speechObject.key2;
        this.language = speechObject.lang;
        this.audioContext = new window.AudioContext();
    }

    /*
    //this can only be called from the background script
    static ensureRecorderTab(initiatorTabId) {
        const recorderTabTitle = "Voice Command";
        chrome.tabs.query({ title: recorderTabTitle }, (tabs) => {
            if (tabs.length !== 0) {
                let recorderTab = tabs[0];
                //makes sure that recorderTab stays inactive after accepting mic permission the first time it was created
                this._setTabToActiveState(recorderTab.id, false);
                //send message to recorderTab to initiate captureAudio()
                this._initiateCaptureAudio(recorderTab.id, initiatorTabId);
            } else {
                We need to send a message to the recorderTab once it has been created AND it has finished
                adding its message listener functions. If we send the message too early the message may get
                dropped (because there is no listener for it). Additionally, we need to pass through the "initiatorTabId". 
                To solve this we add a listener here for updates to tabs. We must add the update listener first because there
                is a race condition between when the newly created tab is complete and when we add the tab updated listener.
                Once we have detected that the recorderTab has completely loaded we know it has a listener registered and it 
                is safe to send it a message.
                let recorderTabId = -1;
                let recorderTabOnUpdatedListener = (tabId, info, tab) => {
                    //Ignore updates to any tab but the recorderTab
                    if (info.status === "complete" && tab.title === recorderTabTitle && recorderTabId !== -1) {

                        chrome.tabs.sendMessage(initiatorTabId, { type: MessageTypes.HideProgressRing });

                        //send message to recorderTab to initiate captureAudio()
                        this._initiateCaptureAudio(recorderTabId, initiatorTabId);
                        chrome.tabs.onUpdated.removeListener(recorderTabOnUpdatedListener);
                    }
                }
                chrome.tabs.onUpdated.addListener(recorderTabOnUpdatedListener);
                chrome.tabs.create({
                    url: chrome.extension.getURL('pages/recorderTab.html'),
                    active: true,
                    index: 999
                }, (tab) => {
                    recorderTabId = tab.id;
                });
            }
        });
    }
    
    static closeRecorderTab() {
        chrome.tabs.query({ title: "Voice Command" }, (tabs) => {
            chrome.tabs.remove(tabs[0].id);
        });
    }

    static _initiateCaptureAudio(recorderTabId, initiatorTabId) {
        chrome.tabs.sendMessage(recorderTabId, {
            type: MessageTypes.CaptureAudio,
            initiatorTabId: initiatorTabId
        });
    }

    static _setTabToActiveState(tabId, active) {
        chrome.tabs.update(tabId, {
            active: active
        });
    }

    
    static _setUiStateToListening(initiatorTabId, recordTimeInMs) {
        chrome.tabs.sendMessage(initiatorTabId, {
            type: MessageTypes.StartLoadingBar,
            info: null,
            initiatorTabId: initiatorTabId,
            recordTimeInMs: recordTimeInMs
        });
    }
     */
    
    _getAudioResponse(xhrResponse) {
        let response = JSON.parse(xhrResponse);
        let result = response.results[0];
        let userInput = result.name.trim();
        return { text: userInput, confidenceLevel: result.confidence };
    }

    _getAudioResponseError() {
        return { errorOrigin: MessageTypes.MediaInputError, errorType: 'Media Input', details: 'No Speech or Microphone is muted' };
    }

    _getXhrTokenError(status, statusText) {
        return { errorOrigin: MessageTypes.TokenXhrError, errorType: status, details: statusText };
    }

    _getXhrAudioError(status, statusText) {
        return { errorOrigin: MessageTypes.AudioXhrError, errorType: status, details: statusText };
    }

    _getUserMediaError(errorObject) {
        return { errorOrigin: MessageTypes.GetUserMediaError, errorType: errorObject.code, details: errorObject.name };
    }

    _extractToken(tokenResponse) {
        let response = JSON.parse(tokenResponse);
        let token = response.access_token;
        return token;
    }

    /*
    The BING Speech API requires a token in order to complete request, this is a promise
    that will ensure that we request a token first.
    */
    getToken() {
        let tokenPromise = new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            const tokenUrl = 'https://oxford-speech.cloudapp.net/token/issueToken';
            const scope = 'https://speech.platform.bing.com';
            let data = [
                'grant_type=client_credentials',
                '&client_id=' + encodeURIComponent(this.clientID),
                '&client_secret=' + encodeURIComponent(this.clientSecret),
                '&scope=' + scope
            ].join('');

            xhr.open('POST', tokenUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

            xhr.onload = () => {
                if (xhr.readyState === xhr.DONE) {
                    if (xhr.status === 200) {
                        resolve(this._extractToken(xhr.response));
                    } else {
                        reject(this._getXhrTokenError(xhr.status, xhr.statusText));
                    }
                }
            }
            xhr.onerror = () => {
                reject(this._getXhrTokenError(xhr.status, xhr.statusText));
            }
            xhr.send(data);
        });
        return tokenPromise;
    }

    sendAudio(audioData, token) {
        let audioPromise = new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            let recognizeUrl = [
                'https://speech.platform.bing.com/recognize',
                '?scenarios=ulm',
                '&appID=D4D5267291D74C748AD842B1D98141A5',
                '&locale=' + this.language,
                '&device.os=Windows',
                '&version=3.0',
                '&format=json',
                '&requestid=b2c95ede-97eb-4c88-81e4-80f32d6aee54',
                '&instanceid=1d4b6030-9099-11e0-91e4-0800200c9a66'
            ].join('');

            xhr.open('POST', recognizeUrl, true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            xhr.setRequestHeader('Content-Type', 'audio/wav; samplerate=16000');

            xhr.onload = () => {
                if (xhr.readyState === xhr.DONE) {
                    if (xhr.status === 200) {
                        if (!JSON.parse(xhr.response).hasOwnProperty('results')) {
                            reject(this._getAudioResponseError());
                        } else {
                            resolve(this._getAudioResponse(xhr.response));
                        }
                    } else {
                        reject(this._getXhrAudioError(xhr.status, xhr.statusText));
                    }
                }
            }
            xhr.onerror = () => {
                reject(this._getXhrAudioError(xhr.status, xhr.statusText));
            }
            xhr.send(audioData);
        });
        return audioPromise;
    }

    startSpeechToText() {
        let speechPromise = new Promise((resolve, reject) => {
                navigator.mediaDevices
                    .getUserMedia({
                        audio: true
                    })
                    .then((stream) => {
                        let audioInput = this.audioContext.createMediaStreamSource(stream);
                        let rec = new Recorder(audioInput);
                        rec.record();
                        setTimeout(() => {
                            rec.stop();
                            rec.exportWAV((blob) => {
                                this.getToken()
                                    .then((token) => {
                                        this.sendAudio(blob, token)
                                            .then((audioResponse) => {
                                                resolve(audioResponse);
                                            })
                                            .catch((errorObject) => {
                                            	console.log(errorObject.description);
                                                reject(errorObject);
                                            });
                                    })
                                    .catch((errorObject) => {
                                    	console.log(errorObject.description);
                                        reject(errorObject);
                                    });
                            });
                        });
                    })
                    .catch((errorObject) => {
                    	console.log(errorObject.description);
                        reject(this._getUserMediaError(errorObject));
                    });
        });
        return speechPromise;
    }

}