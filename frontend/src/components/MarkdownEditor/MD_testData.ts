// testData.ts
export const basicMarkdown = `# Markdown 编辑器测试

这是一个基本的段落，用于测试文本渲染。

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题
`;

export const formattedText = `
## 文本格式化

**这是粗体文本**

*这是斜体文本*

***这是粗斜体文本***

~~这是删除线文本~~

这是一个[链接](https://example.com)

这是一个带标题的[链接](https://example.com "链接标题")
`;

export const lists = `
## 列表

### 无序列表
* 项目 1
* 项目 2
  * 子项目 2.1
  * 子项目 2.2
* 项目 3

### 有序列表
1. 第一项
2. 第二项
   1. 子项 2.1
   2. 子项 2.2
3. 第三项
`;

export const codeBlocks = `
## 代码

行内代码: \`const greeting = "Hello World";\`

代码块:
\`\`\`javascript
function sayHello() {
  console.log("Hello, world!");
  return true;
}
\`\`\`

Python 代码:
\`\`\`python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
\`\`\`

CSS 代码:
\`\`\`css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
\`\`\`
`;

export const tables = `
## 表格

| 姓名 | 年龄 | 职业 |
|------|------|------|
| 张三 | 28   | 工程师 |
| 李四 | 32   | 设计师 |
| 王五 | 45   | 经理 |

对齐方式:

| 左对齐 | 居中对齐 | 右对齐 |
|:-------|:-------:|-------:|
| 单元格 | 单元格 | 单元格 |
| 单元格 | 单元格 | 单元格 |
`;

export const quotes = `
## 引用

> 这是一个简单的引用

> 这是一个多行引用
> 
> 它有多个段落
>
> > 这是嵌套引用
`;

export const images = `
## 图片

![示例图片](https://via.placeholder.com/150)

![带标题的图片](https://via.placeholder.com/300x200 "图片标题")
`;

export const horizontalRules = `
## 水平线

---

***

___
`;

export const complexExample = `
# 复杂 Markdown 示例

这是一个包含多种 Markdown 元素的复杂示例，用于测试编辑器的综合功能。

## 1. 文本和格式

普通文本段落。**粗体文本**和*斜体文本*以及***粗斜体***。

这里有一些~~删除线文本~~和\`行内代码\`。

## 2. 列表和嵌套

### 无序列表
- 项目 A
  - 子项目 A.1
  - 子项目 A.2
- 项目 B
  - 子项目 B.1
    - 子子项目 B.1.1

### 有序列表
1. 第一步
2. 第二步
   1. 子步骤 2.1
   2. 子步骤 2.2
3. 第三步

## 3. 代码块与语法高亮

\`\`\`javascript
// 一个简单的 JavaScript 函数
function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 10);
console.log(\`计算结果: \${result}\`);
\`\`\`

\`\`\`python
# Python 类示例
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def greet(self):
        return f"你好，我是{self.name}，今年{self.age}岁。"

person = Person("张三", 30)
print(person.greet())
\`\`\`

## 4. 表格

| 功能 | 描述 | 支持状态 |
|------|------|---------|
| 标题 | Markdown 标题语法 | ✅ |
| 格式化文本 | 粗体、斜体等 | ✅ |
| 列表 | 有序和无序列表 | ✅ |
| 代码块 | 支持语法高亮 | ✅ |
| 表格 | 创建表格 | ✅ |

## 5. 引用和嵌套引用

> 这是一级引用
> 
> 继续一级引用
> 
> > 这是嵌套的二级引用
> > 
> > 继续二级引用
> 
> 回到一级引用

## 6. 链接和图片

[点击访问示例网站](https://example.com)

![示例图片](https://via.placeholder.com/500x200 "这是一个示例图片")

## 7. 水平分割线

---

## 8. 任务列表

- [x] 已完成任务
- [ ] 未完成任务
- [x] 另一个已完成任务
- [ ] 最后一个未完成任务

## 9. 数学公式 (如果支持)

行内公式: $E=mc^2$

块级公式:

$$
\\frac{d}{dx}\\left( \\int_{a}^{x} f(u)\\,du\\right)=f(x)
$$

## 10. 脚注

这里有一个脚注引用[^1]

[^1]: 这是脚注的内容。
`;

export const streamingExample = `# 大模型流式输出示例

这是一个模拟大模型**流式输出**的示例文本。

## 代码生成

以下是一个简单的 React 组件:

\`\`\`jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>当前计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  );
}

export default Counter;
\`\`\`

## 表格数据

| 日期 | 温度 | 天气 |
|------|------|------|
| 周一 | 25°C | 晴天 |
| 周二 | 22°C | 多云 |
| 周三 | 18°C | 雨天 |

## 结论

流式输出可以让用户体验更加流畅，减少等待时间。
`;

// 导出所有测试数据
export const testData = {
  basicMarkdown,
  formattedText,
  lists,
  codeBlocks,
  tables,
  quotes,
  images,
  horizontalRules,
  complexExample,
  streamingExample
};

export default testData;