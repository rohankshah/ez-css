
## Installation

Install package

```bash
  npm i @rohankshah/ez-css
```

Start watch mode

```bash
  npx @rohankshah/ez-css watch
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