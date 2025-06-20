

def get_example():
    return """
## 🚨 A级：投标决策必需信息

| 序号 | 信息类别 | 具体内容 | 所在章节 | 分析进展 |
|------|----------|----------|----------|----------|
| A1 | ⏰ 时间节点 | 投标截止时间/开标时间 |  |  |
| A2 | 💰 保证金 | 投标保证金金额/缴纳方式 |  |  |
---    
    """


def get_checklist_keyinfo():
    
    return """

# 📋 招标文件内容定位清单

> **使用说明**：按清单逐项查找并记录章节位置，标记找不到的项目（可能不适用），重点关注A、B级信息

---

## 🚨 A级：投标决策必需信息

| 序号 | 信息类别 | 具体内容 | 所在章节 | 分析进展 |
|------|----------|----------|----------|----------|
| A1 | ⏰ 时间节点 | 投标截止时间/开标时间 |  |  |
| A2 | 💰 保证金 | 投标保证金金额/缴纳方式 |  |  |
| A3 | 💵 预算信息 | 项目预算/最高限价/控制价 |  |  |
| A4 | 📜 资格要求 | 企业资质/业绩/人员/财务 |  |  |
| A5 | 📊 评分标准 | 评分标准和权重分配 |  |  |
| A6 | 📝 项目概况 | 项目基本信息（名称/地点/规模） |  |  |
| A7 | ✅ 中标条件 | 中标条件/废标条件 |  |  |

---

## 🔧 B级：方案制定核心信息

| 序号 | 信息类别 | 具体内容 | 所在章节 | 分析进展 |
|------|----------|----------|----------|----------|
| B1 | 🛠️ 技术要求 | 技术要求/功能规格书 |  |  |
| B2 | 📈 性能指标 | 性能指标/技术参数 |  |  |
| B3 | 📅 实施周期 | 项目实施周期/交付时间 |  |  |
| B4 | ✔️ 验收标准 | 验收标准/测试要求 |  |  |
| B5 | 📋 商务条款 | 商务条款/合同条件 |  |  |
| B6 | 💳 付款方式 | 付款方式/付款节点 |  |  |
| B7 | 🛡️ 质保要求 | 质保期/维保要求 |  |  |
| B8 | 🔒 知识产权 | 知识产权要求 |  |  |

---

## 📄 C级：投标文件制作要求

| 序号 | 信息类别 | 具体内容 | 所在章节 | 分析进展 |
|------|----------|----------|----------|----------|
| C1 | 📖 格式要求 | 投标文件格式/装订要求 |  |  |
| C2 | 🔧 技术标 | 技术标编制要求 |  |  |
| C3 | 💼 商务标 | 商务标编制要求 |  |  |
| C4 | 🏅 资格标 | 资格标编制要求 |  |  |
| C5 | 📋 证明材料 | 需要提供的证明材料清单 |  |  |
| C6 | 📚 份数要求 | 投标文件份数要求 |  |  |

---

## 🏗️ D级：项目执行细节

| 序号 | 信息类别 | 具体内容 | 所在章节 | 分析进展 |
|------|----------|----------|----------|----------|
| D1 | 📍 实施地点 | 实施地点/工作环境 |  |  |
| D2 | 👥 人员要求 | 人员进场要求 |  |  |
| D3 | 🔐 安全保密 | 安全/保密要求 |  |  |
| D4 | 🎓 培训要求 | 培训要求 |  |  |
| D5 | 🔗 接口对接 | 接口对接要求 |  |  |
| D6 | 📊 项目管理 | 项目管理要求 |  |  |

---

## 📞 E级：程序性信息

| 序号 | 信息类别 | 具体内容 | 所在章节 | 分析进展 |
|------|----------|----------|----------|----------|
| E1 | 👀 现场踏勘 | 现场踏勘安排 |  |  |
| E2 | ❓ 答疑澄清 | 答疑澄清安排 |  |  |
| E3 | 📧 联系方式 | 联系人/联系方式 |  |  |
| E4 | 📍 投标地点 | 投标地点/开标地点 |  |  |
| E5 | ⚠️ 特殊规定 | 特殊规定/注意事项 |  |  |

---

## 📝 使用流程

### 第一步：信息定位
- [ ] 按清单逐项查找并记录章节位置
- [ ] 对找不到的项目标记"N/A"（可能不适用）
- [ ] 重点关注 **A级** 和 **B级** 信息

### 第二步：分析进展标记
**分析进展状态说明**：
- 🔍 **待分析** - 已找到位置，未开始分析
- ✅ **已完成** - 分析完成，无问题
- ❗ **有疑问** - 需要澄清或进一步确认
- ⚠️ **有风险** - 存在潜在风险或难点
- ❌ **不符合** - 我方条件不满足要求

### 第三步：风险识别
- [ ] 汇总标记为"❗有疑问"和"⚠️有风险"的项目
- [ ] 准备澄清问题清单
- [ ] 评估"❌不符合"项目对投标的影响

### 第四步：团队协作
- [ ] 将完成的清单分享给项目团队
- [ ] 建立内容快速检索机制
- [ ] 为后续投标准备工作奠定基础

---

**💡 提示**：建立这份"内容-章节对照表"后，可作为团队协作的标准模板，提高招标文件分析效率。


"""


def checklist_converter(position, topic_keys):
    """
    输入：
        position: 章节位置 init
        topic_keys: 相关主题的key, 比如 [A1, A2, A3]
    输出：
        topic_position_map: 相关主题的key和位置的映射, 比如 {"A1": position, "A2": position, "A3": position}
    """
    # 大模型的输出设计好，可以不需要这个函数

    topic_position_map = {}
    for key in topic_keys:
        topic_position_map[key] = position
    
    return topic_position_map