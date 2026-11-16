# 中文字体（自托管）

页见的界面与 PDF 都使用 Noto Sans SC / Noto Serif SC，**自托管**而非引用 Google Fonts CDN：
内容安全策略不放开外部字体域名，PDF 渲染也需要可离线加载的字节。

## 文件

| 文件                    | 内容                                                   |
| ----------------------- | ------------------------------------------------------ |
| `noto-sans-sc.css`      | 303 个 `@font-face`，覆盖 Noto Sans SC 400 的全部子集  |
| `noto-serif-sc.css`     | 202 个 `@font-face`，覆盖 Noto Serif SC 400 的全部子集 |
| `noto-sans-sc-*.woff2`  | 上述 Sans 分片                                         |
| `noto-serif-sc-*.woff2` | 上述 Serif 分片                                        |
| `OFL-noto-sans-sc.txt`  | Noto Sans SC 的 SIL OFL 1.1 许可证原文                 |
| `OFL-noto-serif-sc.txt` | Noto Serif SC 的 SIL OFL 1.1 许可证原文                |

共 505 个 woff2（303 + 202），约 13.1 MB。

## 来源与改动程度

字体二进制来自 [`@fontsource/noto-sans-sc`](https://fontsource.org/fonts/noto-sans-sc) 与
[`@fontsource/noto-serif-sc`](https://fontsource.org/fonts/noto-serif-sc)，二者是 Google Fonts 的
npm 分发形式。文件名 `noto-sans-sc-<n>-400-normal.woff2` 即 fontsource 的分片命名。

**未修改字形**：只按 fontsource 的 unicode-range 分片原样使用，没有重新子集化、没有改轮廓、
没有改字体名。因此 `font-family: "Noto Sans SC"` 仍是原始字体名，不构成 OFL 意义上的
Modified Version，Reserved Font Name 条款不适用。

## 许可证

两份字体均以 SIL Open Font License 1.1 分发，许可证原文与本目录的 woff2 一同提供，满足
OFL 条件 2「每份副本都包含版权声明与许可证」。版权行不同，故分开存放：

- Noto Sans SC：`Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'`
- Noto Serif SC：`Copyright 2012 Google Inc. All Rights Reserved.`

OFL 允许随软件打包、嵌入与再分发，不要求衍生作品开源；对本项目的 MIT 许可无影响。
