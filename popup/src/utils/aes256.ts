const crypto = require('crypto')
import { keccak_256 } from "@noble/hashes/sha3"
import { Buffer } from "buffer"
const IV_LENGTH = 16
export default {
    encrypt: (text: string, passphrase: string): string => {
        const iv = crypto.randomBytes(IV_LENGTH)
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            Buffer.from(keccak_256(passphrase)),
            iv,
        )
        const encrypted = cipher.update(text)

        return (
            iv.toString('hex') +
            ':' +
            Buffer.concat([encrypted, cipher.final()]).toString('hex')
        )
    },
    decrypt: (text: string, passphrase: string): string => {
        const textParts = text.split(':')
        const ivRaw = textParts.shift();
        if (ivRaw === undefined) {
            throw new Error(`Invalid encrypted text: ${text}`);
        }

        const iv = Buffer.from(ivRaw, 'hex')
        const encryptedText = Buffer.from(textParts.join(':'), 'hex')
        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            Buffer.from(keccak_256(passphrase)),
            iv,
        )
        const decrypted = decipher.update(encryptedText)

        return Buffer.concat([decrypted, decipher.final()]).toString()
    }
}
