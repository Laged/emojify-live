const vscode = acquireVsCodeApi();

// Handle the message inside the webview
window.addEventListener('message', event => {
    evaluate(event.data.data);
});

const evaluate = (_event) => {
    // TODO: fetch from actual API w/ query
    const css = `
    @keyframes phase1 {
        from {
            opacity: 0;
            transform:rotate(0deg);
        }
        to {
            opacity: 50;
            transform:rotate(180deg);
        }
    }
    .phase1 {
        animation-name: phase1;
        animation-duration: 1s;
        opacity: 0;
        transform:rotate(180deg);
    }
    @keyframes phase2 {
        from {
            opacity: 50;
            transform:rotate(180deg);
        }
        to {
            opacity: 0;
            transform:rotate(180deg);
        }
    }
    .phase2 {
        animation-name: phase2;
        animation-duration: 9s;
        opacity: 0;
        transform:rotate(180deg);
    }
    `;
    const phases = [{ emoji: '💩', phase: "phase1", duration: 1000 }, { phase: "phase2", duration: 9000 }];
    const dummyResponse = {
        phases,
        css
    }
    // Create and add css
    const sheet = document.createElement("style");
    sheet.innerText = dummyResponse.css;
    document.head.appendChild(sheet);
    // Initialize elements to manipulate
    const root = /** @type {HTMLElement} */ (document.querySelector(":root"));
    const result = /** @type {HTMLElement} */ (document.getElementById("result"));
    // Iterate through phases and set animations
    let delay = 0;
    phases?.forEach(({emoji, phase, duration}) => {
        if (emoji) {
            root.style.setProperty("--emoji", "'"+emoji+"'");
        }
        if(phase && duration) {
            setTimeout(() => {
                result.classList.add(phase);
            }, delay);
            setTimeout(() => {
                result.classList.remove(phase);
            }, duration+delay);
            delay += duration;
        }
    });
}