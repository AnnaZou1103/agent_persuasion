/**
 * 文件上传测试页面
 * 访问: http://localhost:3000/upload-test
 */

import * as React from 'react';
import { Container, Box, Typography, Tabs, TabList, Tab, TabPanel } from '@mui/joy';
import { FileUploadComponent, SimpleFileUploadButton } from '~/modules/pinecone';
import { AppLayout } from '~/common/layout/AppLayout';

export default function UploadTestPage() {
  const [currentTab, setCurrentTab] = React.useState(0);

  return (
    <AppLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography level="h1" sx={{ mb: 3 }}>
          📤 文件上传测试
        </Typography>

        <Tabs value={currentTab} onChange={(_, value) => setCurrentTab(value as number)}>
          <TabList>
            <Tab>完整上传组件</Tab>
            <Tab>简单上传按钮</Tab>
          </TabList>

          {/* Tab 1: 完整上传组件 */}
          <TabPanel value={0}>
            <Box sx={{ mt: 3 }}>
              <Typography level="h3" sx={{ mb: 2 }}>
                方式 1: 完整的上传界面
              </Typography>
              <Typography level="body-sm" sx={{ mb: 3, color: 'text.secondary' }}>
                这个组件包含文件选择、元数据表单、进度显示和状态提示
              </Typography>
              <FileUploadComponent />
            </Box>
          </TabPanel>

          {/* Tab 2: 简单按钮 */}
          <TabPanel value={1}>
            <Box sx={{ mt: 3 }}>
              <Typography level="h3" sx={{ mb: 2 }}>
                方式 2: 简单上传按钮
              </Typography>
              <Typography level="body-sm" sx={{ mb: 3, color: 'text.secondary' }}>
                快速上传，只需要选择文件
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <SimpleFileUploadButton
                  stance="supporting"
                  onUploadSuccess={(result) => {
                    alert(`✅ 上传成功！\n文件: ${result.name}\nID: ${result.id}`);
                  }}
                  onUploadError={(error) => {
                    alert(`❌ 上传失败：${error.message}`);
                  }}
                />
                
                <SimpleFileUploadButton
                  stance="opposing"
                  onUploadSuccess={(result) => {
                    alert(`✅ 上传成功！\n文件: ${result.name}\nID: ${result.id}`);
                  }}
                  onUploadError={(error) => {
                    alert(`❌ 上传失败：${error.message}`);
                  }}
                />
              </Box>
            </Box>
          </TabPanel>
        </Tabs>

        {/* 使用说明 */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.level1', borderRadius: 'md' }}>
          <Typography level="h4" sx={{ mb: 2 }}>
            ⚙️ 配置说明
          </Typography>
          <Typography level="body-sm" component="div">
            <ol style={{ paddingLeft: '1.5rem', margin: 0 }}>
              <li>确保已配置环境变量：
                <ul style={{ marginTop: '0.5rem' }}>
                  <li><code>PINECONE_API_KEY</code> - 你的 Pinecone API 密钥</li>
                  <li><code>PINECONE_ASSISTANT_NAME</code> - 你的助手名称</li>
                </ul>
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                编辑 <code>.env.local</code> 文件并重启服务器
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                支持的文件格式: PDF, TXT, DOC, DOCX, MD
              </li>
            </ol>
          </Typography>
        </Box>
      </Container>
    </AppLayout>
  );
}

