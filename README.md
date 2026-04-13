
# EZ-CSS

EZ-CSS is a lightweight utility that automatically maps the class names you write in your JSX/TSX to a CSS file.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
![NPM Version](https://img.shields.io/npm/v/%40rohankshah%2Fez-css)

## Features
- Automatically maps the classnames in the css file.
- No need to manually copy paste the classnames again and again.

## Installation

Install package

```bash
  npm i @rohankshah/ez-css
```

## Steps

1. Create `.ez-css-config.json` file in the root folder.

```
{
    "fileType": ["jsx", "tsx"],
    "root": "./src",
    "breakPoints": [768, 1024, 1400]
}
```
2. Start watch mode `npx @rohankshah/ez-css watch`
3. Write HTML with classnames and hit save.

#### Note: While ez-css creates a .css file automatically if one doesn't exist, the file still needs to be manually imported to the component.
