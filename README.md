# 🍱 中国胃老吃家饮食健康站

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-学习用途%20%7C%20商用需授权-orange.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

**一个面向日常饮食决策的食物辞典与营养百科站点**

*Made by MiikuCry* 「互联网答辩生产能手」🔥

[进入引导页](dist/index.html) | [主系统](dist/pages/home.html) | [作者主页](https://github.com/MiikuCry)

</div>

---

## ✨ 项目特色

- 🧭 **清晰导航分层**：一级页面聚焦核心功能，二级页面服务于主表精查
- 🍽️ **食物卡片化检索**：告别传统表格，支持关键词、分类、菜系、热量区间筛选
- 🥦 **常见食材一览**：汇总食材营养、分类说明、使用说明和菜肴标杆对照
- 🔥 **双向决策辅助**：支持“每日营养需求估算”与“运动能量消耗估算”
- 🌈 **现代化视觉与特效**：科技感引导页、玻璃卡片、粒子背景、过场动画
- 📱 **响应式适配**：桌面与移动端都可正常浏览和操作
- 💾 **纯静态零依赖**：HTML + CSS + JavaScript，本地即可运行

---

## 💡 项目初衷

这个项目最初是作者在减脂阶段做的自用工具：作者本人正在减肥，顺手把平时查资料和做饮食决策的流程整理成了这个小站，也希望能帮到所有老吃家进行健康的生活。

---

## 🗂️ 页面结构

### 一级页面
- `食物主表`
- `常见食材一览`
- `每日营养需求`
- `运动能量消耗`

### 二级页面（归属食物主表）
- `菜名索引`
- `分类索引`

---

## 🚀 快速开始

### 本地打开
```bash
# 进入项目目录
cd 中国饮食参考

# 直接打开引导页
dist/index.html
```

### 数据更新（Excel 改动后）
```bash
python tools/generate_data.py
```

---

## 📦 目录结构

```text
中国饮食参考/
├── dist/                      # 可直接交付的静态站点
│   ├── index.html             # 引导页
│   ├── pages/                 # 功能页面
│   └── assets/                # 样式、脚本、数据
├── data-source/               # 源数据（Excel）
│   └── 中国常见食品营养参考_v3.xlsx
├── tools/
│   └── generate_data.py       # 数据生成脚本
├── LICENSE                    # 学习使用许可（商用需授权）
├── 参考.md                    # 你提供的 README 风格参考
└── README.md
```

---

## 🛠️ 技术栈

- **HTML5**：页面结构与语义标签
- **CSS3**：现代化视觉风格、响应式布局、动效系统
- **Vanilla JavaScript**：数据加载、筛选、卡片渲染、交互逻辑

---

## 👨‍💻 关于作者

**MiikuCry** 「互联网答辩生产能手」🔥

- 🌐 GitHub: [@MiikuCry](https://github.com/MiikuCry)
- 📺 Bilibili: [@MiikuCry](https://space.bilibili.com/8671633)

---

## ⚠️ 版权声明

本项目为作者个人作品，代码中包含作者署名与防盗标识，请勿移除作者信息后重新发布。

---

## 📄 开源协议

本项目采用“学习使用许可协议”：仅供学习与非商业用途使用。  
如需拷贝或用于商业用途，请联系作者获取书面授权（见 `LICENSE`）。
