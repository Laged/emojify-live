const vscode = acquireVsCodeApi();

// Handle the message inside the webview
window.addEventListener('message', event => {
    const json = JSON.parse(event.data.data)
    evaluate(json);
});

const evaluate = async (_event) => {
    const hotkeys = (e) => {
        const windowEvent = window.event ? event : e;
        const code = windowEvent.keyCode;
        if (code === 8) {
            return clr();
        } else if (code === 13) {
            return emojify();
        }
        const key = String.fromCharCode(code).toLocaleLowerCase();
        const elem = document.getElementById(key);
        if (elem) {
            elem.click();
        }
    };
    //document.onkeydown = hotkeys;
    const addCharacter = (char) => {
        document.getElementById("command").value += char;
    };
    const keyboards = document.querySelectorAll(".keyboard");
    keyboards?.forEach(keyboard => {
        keyboard?.childNodes.forEach(button => {
            button.addEventListener("click", function (event) {
                addCharacter(event.target.innerText);
            });
        });
    })
    const { css, phases } = _event;
    // Create and add css
    const sheet = document.createElement("style");
    sheet.innerText = css;
    document.head.appendChild(sheet);
    // Initialize elements to manipulate
    const root = document.querySelector(":root");
    const result = document.getElementById("result");
    // Iterate through phases and set animations
    let delay = 0;
    phases?.forEach(({emoji, phase, duration}, i) => {
        if(phase) {
            setTimeout(() => {
                result.classList.add(phase);
                if (emoji) {
                    root.style.setProperty("--emoji", "'" + emoji + "'");
                }
            }, delay);
            setTimeout(() => {
                if (i < phases.length-1) {
                    result.classList.remove(phase);
                }
            }, duration+delay);
            delay += duration;
        }
    });
}