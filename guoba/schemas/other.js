export default [
  {
    component: "SOFT_GROUP_BEGIN",
    label: "其他配置"
  },
  {
    field: "other.ys",
    label: "原神关键词发图",
    helpMessage: "无用的功能+1",
    component: "Switch"
  },
  {
    field: "other.renderScale",
    label: "渲染精度",
    helpMessage: "图片渲染的精度，可选范围: 50~200",
    component: "InputNumber",
    required: true,
    componentProps: {
      min: 50,
      max: 200,
      placeholder: "请输入渲染精度, 50到200之间"
    }
  }
]
