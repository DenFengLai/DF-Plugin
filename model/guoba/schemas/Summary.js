export default [
  {
    component: "Divider",
    label: "图片外显设置"
  },
  {
    field: "summary.sum",
    label: "图片外显开关",
    component: "Switch"
  },
  {
    field: "summary.type",
    label: "外显模式",
    bottomHelpMessage: "可选自定义文本或使用一言接口",
    component: "RadioGroup",
    required: true,
    componentProps: {
      options: [
        { label: "自定义文字", value: 1 },
        { label: "使用一言接口", value: 2 },
        { label: "使用自定义列表", value: 3 }
      ]
    }
  },
  {
    field: "summary.list",
    label: "外显随机文字列表",
    bottomHelpMessage: "外显模式设置成3后将随机返回列表里的随机一项",
    component: "GTags",
    componentProps: {
      allowAdd: true,
      allowDel: true
    }
  },
  {
    field: "summary.text",
    label: "自定义外显文字",
    helpMessage: "输入文字可在发送图片时显示",
    bottomHelpMessage: "设置外显类型为自定义文字时可用",
    component: "Input",
    required: true,
    componentProps: {
      placeholder: "请输入文字外显"
    }
  },
  {
    field: "summary.api",
    label: "一言接口地址",
    helpMessage: "图片外显请求的接口地址",
    bottomHelpMessage: "无特殊情况不要改",
    component: "Input",
    required: true,
    componentProps: {
      placeholder: "请输入接口地址"
    }
  }
]
