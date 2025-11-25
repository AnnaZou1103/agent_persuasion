<!-- 715e603f-fb7d-401f-86f2-f63f7eb62436 440d3e35-fe8d-46f2-bc26-c8c1e70ee61a -->
# 主题选择功能实现计划

## 功能需求

- 在对话开始前显示主题选择界面
- 两个预定义主题：

1. "How should Boston respond to the Mass & Cass crisis (balancing harm reduction, public safety, and homelessness)?"
2. "Should Cell Phones Be Banned in Schools?"

- 主题选择后：
- 存储到 `conversation.searchTopic`
- 添加到系统提示词（system prompt）
- 在初始消息（initialmessage）中显示主题信息
- 显示时机：创建新对话时，以及每次对话为空时（包括首次加载）
- 已开始的对话不允许修改主题

## 实现步骤

### 1. 创建主题选择模态框组件

**文件**: `src/apps/chat/components/TopicSelectionModal.tsx`

- 使用 `GoodModal` 作为基础
- 显示两个主题选项（按钮或卡片）
- 选择后调用回调函数，传递选中的主题
- 模态框不可关闭（必须选择主题）

### 2. 定义主题常量

**文件**: `src/conversational-search.config.ts` 或新建 `src/apps/chat/topics.ts`

- 定义两个主题常量
- 导出主题列表供组件使用

### 3. 修改系统提示词生成逻辑

**文件**: `src/apps/chat/editors/editors.ts`

- 在 `updatePurposeInHistory` 函数中：
- 获取当前对话的 `searchTopic`
- 如果存在主题，将其添加到系统提示词中
- 格式：在系统提示词开头或适当位置添加主题信息

### 4. 修改初始消息显示

**文件**: `src/common/state/store-chats.ts`

- 修改 `initialmessage` 的生成逻辑：
- 根据对话的 `searchTopic` 动态生成初始消息
- 如果无主题，显示默认消息
- 如果有主题，在消息中包含主题信息

### 5. 在AppChat中集成主题选择逻辑

**文件**: `src/apps/chat/AppChat.tsx`

- 添加状态管理主题选择模态框的显示
- 检测对话是否为空（无用户消息）
- 检测对话是否有主题（`searchTopic`）
- 在以下情况显示主题选择：
- 创建新对话时
- 切换到空对话时
- 首次加载时如果默认对话为空
- 选择主题后，调用 `setSearchConfig` 保存主题

### 6. 确保已开始对话不能修改主题

**文件**: `src/apps/chat/AppChat.tsx`

- 在显示主题选择前检查：
- 对话是否有用户消息（`conversation.messages.filter(msg => msg.role === 'user').length > 0`）
- 如果有用户消息，不显示主题选择模态框

## 关键文件修改

1. **新建**: `src/apps/chat/components/TopicSelectionModal.tsx` - 主题选择UI
2. **新建**: `src/apps/chat/topics.ts` - 主题常量定义
3. **修改**: `src/apps/chat/editors/editors.ts` - 系统提示词集成主题
4. **修改**: `src/common/state/store-chats.ts` - 动态生成初始消息
5. **修改**: `src/apps/chat/AppChat.tsx` - 主题选择逻辑集成

## 技术细节

- 使用 MUI Joy 组件库（与现有代码风格一致）
- 主题存储在 `DConversation.searchTopic` 中（已存在字段）
- 系统提示词修改在 `updatePurposeInHistory` 中进行
- 初始消息需要根据主题动态生成，可能需要修改 `AppChat.tsx` 中显示 `initialmessage` 的逻辑

### To-dos

- [ ] 创建主题常量定义文件 (src/apps/chat/topics.ts)，定义两个预定义主题
- [ ] 创建主题选择模态框组件 (TopicSelectionModal.tsx)，使用GoodModal，显示两个主题选项
- [ ] 修改editors.ts中的updatePurposeInHistory函数，将主题集成到系统提示词中
- [ ] 修改AppChat.tsx中显示initialmessage的逻辑，根据选择的主题动态显示包含主题信息的初始消息
- [ ] 在AppChat.tsx中集成主题选择逻辑：检测空对话、显示模态框、保存选择的主题
- [ ] 确保已开始的对话（有用户消息）不显示主题选择模态框