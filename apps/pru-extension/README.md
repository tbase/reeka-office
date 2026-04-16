# PRU Extension

用于在 Chrome 中抓取 PRU 数据，并导出为 CSV 文件。

当前支持：

- 代理人信息
- 月汇总业绩

## 开发

```bash
pnpm install
pnpm --filter pru-extension dev
```

## 构建

```bash
pnpm --filter pru-extension build
```

构建产物输出到 `apps/pru-extension/dist`。

## 加载方式

1. 打开 `chrome://extensions`
2. 开启右上角“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择目录 `apps/pru-extension/dist`

## 使用方式

1. 先在同一个 Chrome Profile 中登录：
   - `https://salesforce.prudential.com.hk/sap/home/`
   - `https://aes.prudential.com.hk/aes/AESServlet?type=iPC`
2. 点击扩展图标，扩展会打开一个独立页面
3. 在设置区填写 `agentCode`
4. 选择抓取类型并开始抓取
5. 抓取完成后点击下载 CSV

## 权限

- `cookies`
- `storage`
- `tabs`
- Host permissions:
  - `https://salesforce.prudential.com.hk/*`
  - `https://aes.prudential.com.hk/*`
