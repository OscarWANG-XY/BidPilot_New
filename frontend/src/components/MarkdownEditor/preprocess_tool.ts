
export function preprocessMarkdown(raw: string): string {
  let result = raw;

  // 1. 保证所有标题之前有空行
  result = result.replace(/([^\n])(\n#+ )/g, '$1\n$2');

  // 2. 标题层级纠正：避免从 h3 开始（可选）
  // 如果想强制最小从 h1/h2 开始，可以按需 downgrade/upgrade

  // 3. 列表前加空行
  result = result.replace(/([^\n])(\n[ \t]*[-*+]\s)/g, '$1\n$2');

  // 4. 列表项内部如有多个段落，确保段落间有空行
  result = result.replace(/([*-+]\s[^\n]+)(\n)(?!\n)/g, '$1\n\n');

  // 5. 修复表格没有换行
  result = result.replace(/([^\n])(\n\|)/g, '$1\n$2');

  // 6. 自定义：支持 !!红字!! 和 ==高亮== 样式 -> 转成 HTML span
  result = result.replace(/!!(.*?)!!/g, '<span style="color:red;font-weight:bold;">$1</span>');
  result = result.replace(/==(.+?)==/g, '<span style="background-color:yellow;">$1</span>');

  // 7. 清除多余的空格行（最多保留 1 行空行）
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim(); // 去掉首尾空行
}