/**
 * 
 */
const MessageTypes = {
    /* background script messages */
    StartListening: 0,
    SpeechInput: 1,
    OnSpeechFailure: 2,
    Telemetry: 3,
    LaunchHelpPage: 4,
    GetLastUiState: 5,
    ClearLastUiState: 6,
    /* content script messages */
    MediaInputError: 7,
    TokenXhrError: 8,
    AudioXhrError: 9,
    GetUserMediaError: 10,
    ShowCommandText: 11,
    CaptureAudio: 12,
    ExecuteCommand: 13,
    InvalidCommandError: 14,
    SuggestCommands: 15,
    MoveButtonLocation: 16,
    StartLoadingBar: 17,
    DisplayProcessing: 18,
    HideProgressRing: 19,
    RecorderTabClosed: 20
};