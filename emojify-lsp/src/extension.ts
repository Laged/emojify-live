import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('emojify.start', () => {
			WebviewPanel.createOrShow(context.extensionUri);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('emojify.sendSelection', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const word = editor.document.getText(editor.selection);
				WebviewPanel.currentPanel?.doRefactor(word);
            }
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		vscode.window.registerWebviewPanelSerializer(WebviewPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				WebviewPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		enableScripts: true,
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}

class WebviewPanel {
	public static currentPanel: WebviewPanel | undefined;

	public static readonly viewType = 'emojify';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (WebviewPanel.currentPanel) {
			WebviewPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			WebviewPanel.viewType,
			'Emoji Coding',
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri),
		);

		WebviewPanel.currentPanel = new WebviewPanel(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		WebviewPanel.currentPanel = new WebviewPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => {
            this.dispose()
        }, null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(e => {
			if (this._panel.visible) {
					this._update();
			}
		}, null, this._disposables);

		this._panel.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'alert':
					vscode.window.showErrorMessage(message.text);
					return;
			}
		}, null, this._disposables);
	}

	public doRefactor(data: string) {
		this._panel.webview.postMessage({ data: data });
	}

	public dispose() {
		WebviewPanel.currentPanel = undefined;
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
        this._panel.title = 'Emoji Coding';
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const js = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');
		const css = vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css');

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1" charset='utf-8'>
				<link href="${webview.asWebviewUri(css)}" rel="stylesheet">
			</head>
			<body>
                <div id="container">
                    <div id="hero">
                        <h1 id="title">
                            emojify.live
                        </h1>
                    </div>
                    <div id="result"/>
                </div>
				<script src="${webview.asWebviewUri(js)}"></script>
			</body>
			</html>`;
	}
}