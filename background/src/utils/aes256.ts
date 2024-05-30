// const crypto = require('crypto')
import { keccak_256 } from "@noble/hashes/sha3";
const IV_LENGTH = 16;
export default {
	encrypt: async (text: string, passphrase: string): Promise<string> => {
		const key = await crypto.subtle.importKey(
			"raw",
			Buffer.from(keccak_256(passphrase)),
			{ name: "AES-CBC" },
			true,
			["encrypt", "decrypt"],
		);
		const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
		const encrypted = await crypto.subtle.encrypt(
			{
				name: "AES-CBC",
				iv,
				length: 256,
			},
			key,
			Buffer.from(text),
		);

		return (
			Buffer.from(iv).toString("hex") +
			":" +
			Buffer.from(encrypted).toString("hex")
		);
	},
	decrypt: async (text: string, passphrase: string): Promise<string> => {
		const textParts = text.split(":");
		const iv = Buffer.from(textParts.shift(), "hex");
		const encryptedText = Buffer.from(textParts.join(":"), "hex");
		const key = await crypto.subtle.importKey(
			"raw",
			Buffer.from(keccak_256(passphrase)),
			{ name: "AES-CBC" },
			true,
			["encrypt", "decrypt"],
		);
		const decrypted = await crypto.subtle.decrypt(
			{
				name: "AES-CBC",
				iv,
				length: 256,
			},
			key,
			encryptedText,
		);

		return Buffer.from(decrypted).toString();
	},
};
