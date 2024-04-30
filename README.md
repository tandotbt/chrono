# The Wallet for Nine Chronicles
This is a crypto wallet service of chrome extension for Nine Chronicles blockchain.

Chrono SDK Document
https://chrono-docs.pages.dev/

## Project Structure

- /background
  - Implements the background context of the chrome extension. This is where important data storage and operations are executed.
- /popup
  - Implement popup UI for chrome extension. It is responsible for receiving user actions and communicating with the background context.
- /extension
  - This is where you handle the manifest settings and final build of your chrome extension.
- /examples
  - 

## Test coverage
- background
  - In this place, the main wallet data is stored, and the operation is performed by restoring it. Therefore, tests are performed on the corresponding major operations.
  - https://htmlpreview.github.io/?https://github.com/tx0x/chrono/blob/main/background/coverage/lcov-report/index.html
- popup
  - Since UI implementation is the main focus here, we test whether the UI works normally.
  - https://htmlpreview.github.io/?https://github.com/tx0x/chrono/blob/main/popup/coverage/lcov-report/index.html

## Getting started

### 1. Pull this project to local

```
git clone https://github.com/planetarium/chrono
cd chrono
pnpm install
```

### 2. Build

```
pnpm -r build
```

### 3. Import chrome extension for development

- open `chrome://extensions` on chrome
- Load the unzipped extension.
- select ~/chrono/extension

## License

GPL-3.0
