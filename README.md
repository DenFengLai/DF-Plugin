# DF-Plugin

适用于Miao-Yunzai和TRSS-Yunzai的拓展插件。

![Nodejs](https://img.shields.io/badge/-Node.js-3C873A?style=flat&logo=Node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/-JavaScript-eed718?style=flat&logo=javascript&logoColor=ffffff)
[![Gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square)](https://gitmoji.dev)
[![license](https://img.shields.io/github/license/Denfenglai/DF-Plugin.svg?style=flat&logo=gnu)](https://github.com/Denfenglai/DF-Plugin/blob/master/LICENSE)

[![Yunzai-Bot](https://img.shields.io/badge/Yunzai_Bot-V3-red)](https://gitee.com/Le-niao/Yunzai-Bot)
[![Miao-Yunzai V3](https://img.shields.io/badge/Miao_Yunzai-V3-yellow)](https://github.com/yoimiya-kokomi/Miao-Yunzai)
[![TRSS-Yunzai](https://img.shields.io/badge/TRSS_Yunzai-V3-blue)](https://github.com/TimeRainStarSky/Yunzai)

[![Gitee stars](https://gitee.com/DenFengLai/DF-Plugin/badge/star.svg?theme=dark)](https://gitee.com/DenFengLai/DF-Plugin/stargazers)
[![Gitee forks](https://gitee.com/DenFengLai/DF-Plugin/badge/fork.svg?theme=dark)](https://gitee.com/DenFengLai/DF-Plugin/members)
[![GitHub stars](https://img.shields.io/github/stars/DenFengLai/DF-Plugin)](https://github.com/DenFengLai/DF-Plugin/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/DenFengLai/DF-Plugin)](https://github.com/DenFengLai/DF-Plugin/network)

[![Fork me on Gitee](https://gitee.com/DenFengLai/DF-Plugin/widgets/widget_6.svg)](https://gitee.com/DenFengLai/DF-Plugin)

## 💡 安装教程

- 使用Gitee

```sh
git clone -b master --depth=1 https://gitee.com/DenFengLai/DF-Plugin.git ./plugins/DF-Plugin
```

- 使用Github

```sh
git clone -b master --depth=1 https://github.com/DenFengLai/DF-Plugin.git ./plugins/DF-Plugin
```

## 🤗 已实现的功能

<details><summary>随机图片</summary>

- #来张JK / 黑丝 / cos / 腿子 / 丛雨 /诗歌剧

> 随机发送一张图片

</details>

<details><summary>给主人带话</summary>

- #联系主人 + `消息内容`  

> 详细配置请见[config/sendMaster.yaml](/config/default_config/sendMaster.yaml)

</details>

<details><summary>随机网易云</summary>

- #来首歌

> 从API获取一首网易云歌曲

</details>

<details><summary>随机表情戳一戳</summary>

> 戳一戳返回随机表情包  
> 配置项请看[config/other.yaml](/config/default_config/other.yaml)  
> 使用 #DF安装图库 可安装图库到本地使用  
> 未安装图库将调用[XY-Api](https://api.yugan.love/)

</details>

<details><summary>Git仓库更新推送</summary>

> 在[配置文件](/config/default_config/CodeUpdate.yaml)配置完成填写群号后即可使用。  
> 推荐使用[锅巴插件](https://gitee.com/guoba-yunzai/guoba-plugin.git)进行配置

- 使用`#检查仓库更新`可以手动进行一次推送

</details>

<details><summary>图片外显</summary>

> 配置请看[summary.yaml](./config/default_config/summary.yaml)  
> 推荐使用[锅巴插件](https://gitee.com/guoba-yunzai/guoba-plugin.git)进行配置

- #开启/关闭图片外显
- #设置图片外显 + 文字

</details>

- 更多功能请使用 `#DF帮助`

## ⚙️ 插件配置

本插件已全面兼容[锅巴插件](https://gitee.com/guoba-yunzai/guoba-plugin.git)，推荐使用锅巴插件进行配置。

## 📄 计划工程

- [x] 能跑
- [x] 能用
- [x] 支持用户自定义配置
- [x] 添加帮助信息和版本信息 [@kesally](https://gitee.com/kesally)
- [ ] 丰富功能
- [ ] 持续完善
- [ ] ~~删库跑路~~

## ✨ 贡献者

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-6-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

感谢这些了不起的人 ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yeyang52"><img src="https://avatars.githubusercontent.com/u/107110851?v=4?s=100" width="100px;" alt="椰羊"/><br /><sub><b>椰羊</b></sub></a><br /><a href="#example-yeyang52" title="Examples">💡</a> <a href="https://github.com/Denfenglai/DF-Plugin/commits?author=yeyang52" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/TimeRainStarSky"><img src="https://avatars.githubusercontent.com/u/63490117?v=4?s=100" width="100px;" alt="时雨◎星空"/><br /><sub><b>时雨◎星空</b></sub></a><br /><a href="#mentoring-TimeRainStarSky" title="Mentoring">🧑‍🏫</a> <a href="https://github.com/Denfenglai/DF-Plugin/commits?author=TimeRainStarSky" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/qsyhh"><img src="https://avatars.githubusercontent.com/u/132750431?v=4?s=100" width="100px;" alt="其实雨很好"/><br /><sub><b>其实雨很好</b></sub></a><br /><a href="https://github.com/Denfenglai/DF-Plugin/commits?author=qsyhh" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://gitee.com/adrae"><img src="https://foruda.gitee.com/avatar/1706324987763497611/13205155_adrae_1706324987.png!avatar200?s=100" width="100px;" alt="Admilk"/><br /><sub><b>Admilk</b></sub></a><br /><a href="https://github.com/Denfenglai/DF-Plugin/commits?author=Admilkk" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://gitee.com/kesally"><img src="https://avatars.githubusercontent.com/u/110397533?v=4?s=100" width="100px;" alt="kesally"/><br /><sub><b>kesally</b></sub></a><br /><a href="https://github.com/Denfenglai/DF-Plugin/commits?author=kesally" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://gitee.com/shanhai233"><img src="https://foruda.gitee.com/avatar/1723727797498359874/8750220_shanhai233_1723727797.png!avatar200?s=100" width="100px;" alt="桃缘十三"/><br /><sub><b>桃缘十三</b></sub></a><br /><a href="https://github.com/Denfenglai/DF-Plugin/commits?author=shanhai233" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

本段遵循 [all-contributors](https://github.com/all-contributors/all-contributors) 规范，欢迎任何形式的贡献！

## 💬 免责声明

1. 本项目仅供学习使用，请勿用于商业等场景。  

2. 项目内图片、API等资源均来源于网络，如侵犯了您的利益请及时联系项目开发者进行删除。

## 🍀 意见反馈

如果您对本插件有什么建议或使用遇到了问题欢迎对本项目提交[issues](https://github.com/DenFengLai/DF-Plugin/issues/new)。

## 🎨 参与贡献

如果您有兴趣对本项目做出贡献，请阅读[贡献指南](./CONTRIBUTING.md)。

## ⭐ 支持本项目

如果你觉得本项目对你有帮助，请给本项目点点star，你是鼓励是我们前进的动力。

## 💝 友情链接

- [TRSS.me](https://TRSS.me)
- [Yenai-Plugin](https://Yenai.TRSS.me)
- [Fanji-plugin](http://gitee.com/adrae/Fanji-plugin)
- [DF戳一戳图库](https://gitee.com/DenFengLai/poke)

## 🎁 特别鸣谢

- [XY-Api](https://api.yugan.love/)：提供戳一戳图片接口服务支持
- [素颜Api](https://api.suyanw.cn)：提供部分Api服务
