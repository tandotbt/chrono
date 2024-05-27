export default function i18n(name: string) {
	try {
		return chrome.i18n.getMessage(name) || name;
	} catch (e) {
		return name;
	}
}
