export function resolvePassphrase(passphrase) {
    return typeof passphrase === "function"
        ? passphrase()
        : passphrase;
}
