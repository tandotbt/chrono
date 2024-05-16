const crypto = require('crypto')
import { keccak_256 } from "@noble/hashes/sha3"
const IV_LENGTH = 16
export default {
    encrypt: (text, passphrase) => {
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
    decrypt: (text, passphrase) => {
        const textParts = text.split(':')
        const iv = Buffer.from(textParts.shift(), 'hex')
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