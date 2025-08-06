import { PluginPath } from "#model"

export default [
  {
    component: "SOFT_GROUP_BEGIN",
    label: "Git仓库监听配置"
  },
  {
    field: "CodeUpdate.Auto",
    label: "自动检查开关",
    component: "Switch"
  },
  {
    field: "CodeUpdate.AutoBranch",
    label: "自动获取远程默认分支",
    bottomHelpMessage: "在未指定分支的情况下，启动时自动获取远程仓库的默认分支",
    component: "Switch"
  },
  {
    field: "CodeUpdate.Cron",
    label: "自动检查定时表达式",
    helpMessage: "修改后重启生效",
    bottomHelpMessage: "自动检查Cron表达式",
    component: "EasyCron",
    componentProps: {
      placeholder: "请输入Cron表达式"
    }
  },
  {
    field: "CodeUpdate.repos",
    label: "GitApi配置",
    bottomHelpMessage: "Git仓库的接口配置",
    component: "GSubForm",
    componentProps: {
      multiple: true,
      schemas: [
        {
          field: "provider",
          label: "仓库提供商",
          component: "Input",
          componentProps: {
            placeholder: "请输入仓库提供商"
          },
          rules: [
            {
              required: true, message: "不可以为空哦"
            }
          ]
        },
        {
          field: "token",
          label: "认证Token",
          component: "InputPassword",
          componentProps: {
            placeholder: "请输入认证Token"
          },
          bottomHelpMessage: "Gitee 令牌获取地址：https://gitee.com/profile/personal_access_tokens \nGithub 令牌获取地址：https://github.com/settings/tokens \nGitcode 令牌获取地址：https://gitcode.com/setting/token-classic 其他的请自行查找"
        },
        {
          field: "ApiUrl",
          label: "Api地址",
          component: "Input",
          componentProps: {
            placeholder: "请输入Api地址"
          },
          rules: [
            {
              required: true, message: "不可以为空哦"
            }
          ]
        },
        {
          field: "icon",
          label: "图标",
          component: "Input",
          bottomHelpMessage: "仓库提供商的图标地址，支持file://、http://、https://等协议，Gitee、GiHhub、GitCode、Gitea内置图标",
          componentProps: {
            placeholder: "请输入图标地址, 不填为默认图标"
          }
        }
      ]
    }
  },
  {
    field: "CodeUpdate.List",
    label: "推送列表",
    bottomHelpMessage: "Git仓库推送列表",
    component: "GSubForm",
    componentProps: {
      multiple: true,
      schemas: [
        {
          field: "Group",
          helpMessage: "检测到仓库更新后推送的群列表",
          label: "推送群",
          componentProps: {
            placeholder: "点击选择要推送的群"
          },
          component: "GSelectGroup"
        },
        {
          field: "QQ",
          helpMessage: "检测到仓库更新后推送的用户列表",
          label: "推送好友",
          componentProps: {
            placeholder: "点击选择要推送的好友"
          },
          component: "GSelectFriend"
        },
        {
          field: "AutoPath",
          label: "自动获取本地仓库和插件",
          component: "Switch"
        },
        {
          field: "Exclude",
          label: "排除的仓库",
          component: "Select",
          componentProps: {
            allowClear: true,
            mode: "tags",
            get options() {
              return Array.from(new Set(Object.values(PluginPath).flat())).map((name) => ({ value: name }))
            }
          }
        },
        {
          field: "repos",
          label: "监听仓库配置",
          bottomHelpMessage: "Git仓库推送列表",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "provider",
                label: "仓库提供商",
                component: "Input",
                componentProps: {
                  placeholder: "请输入仓库提供商"
                },
                rules: [
                  {
                    required: true, message: "不可以为空哦"
                  }
                ]
              },
              {
                field: "repo",
                label: "仓库名",
                component: "Input",
                componentProps: {
                  placeholder: "请输入仓库名"
                },
                rules: [
                  {
                    pattern: "^([\\w-]+)\\/([\\w.-]+)$",
                    message: "格式不正确，请使用 所有者/存储库 的格式"
                  },
                  {
                    required: true, message: "不可以为空哦"
                  }
                ]
              },
              {
                field: "branch",
                label: "分支名",
                component: "Input",
                componentProps: {
                  placeholder: "请输入分支名"
                }
              },
              {
                field: "type",
                label: "监听类型",
                component: "RadioGroup",
                required: true,
                componentProps: {
                  options: [
                    { label: "提交", value: "commit" },
                    { label: "发布", value: "releases" }
                  ]
                }
              }
            ]
          }
        },
        {
          field: "note",
          label: "备注",
          component: "Input"
        }
      ]
    }
  }
]
