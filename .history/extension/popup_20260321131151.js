document.getElementById("askBtn").addEventListener("click", () => {
    let question = document.getElementById("question").value;

    console.log("Sending question:", question);

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            question: question
        });
    });
});