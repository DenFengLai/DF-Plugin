import { PluginPath } from "#model"

const _ = (a, b) => {
  return {
    field: a,
    label: `${b}仓库路径`,
    bottomHelpMessage: "格式：所有者/存储库:分支, 如: github.com/DenFengLai/DF-Plugin 则填 DenFengLai/DF-Plugin",
    component: "GTags",
    componentProps: {
      allowAdd: true,
      allowDel: true,
      showPrompt: true,
      promptProps: {
        content: "请输入 所有者/存储库:分支",
        placeholder: "请输入仓库路径",
        okText: "添加",
        rules: [
          {
            required: true, message: "不可以为空哦"
          },
          {
            pattern: "^([\\w-]+)\\/([\\w.-]+)(?::([\\w.-]+))?$",
            message: "格式不正确，请使用 所有者/存储库:分支 的格式"
          }
        ]
      }
    }
  }
}

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
    field: "CodeUpdate.GithubToken",
    label: "Github Api Token",
    helpMessage: "用于请求Github Api",
    bottomHelpMessage: "填写后可解除请求速率限制和监听私库，获取地址：https://github.com/settings/tokens",
    component: "InputPassword",
    componentProps: {
      placeholder: "请输入Github Token"
    }
  },
  {
    field: "CodeUpdate.GiteeToken",
    label: "Gitee Api Token",
    helpMessage: "用于请求 Gitee Api",
    bottomHelpMessage: "填写后可解除请求速率限制和监听私库，获取地址：https://gitee.com/profile/personal_access_tokens",
    component: "InputPassword",
    componentProps: {
      placeholder: "请输入Gitee Token"
    }
  },
  {
    field: "CodeUpdate.GitcodeToken",
    label: "Gitcode Api Token",
    helpMessage: "用于请求Gitcode Api",
    bottomHelpMessage: "获取地址：https://gitcode.com/setting/token-classic",
    component: "InputPassword",
    componentProps: {
      placeholder: "请输入Token"
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
        _("GithubList", "Github"),
        _("GithubReleases", "Github发行版"),
        _("GiteeList", "Gitee"),
        _("GiteeReleases", "Gitee发行版"),
        _("GitcodeList", "Gitcode"),
        {
          field: "note",
          label: "备注",
          component: "Input"
        }
      ]
    }
  }
]
