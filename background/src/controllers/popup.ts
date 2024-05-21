export class PopupController {
	async show(): Promise<void> {
		await chrome.windows.create({
			url: "popup/index.html",
			type: "popup",
			focused: true,
			width: 360,
			height: 600,
		});
	}
}
