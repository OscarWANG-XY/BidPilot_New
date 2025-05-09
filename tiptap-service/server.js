const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createEditor } = require('./editor-config');
const { markdownToHtml, htmlToMarkdown } = require('./markdown-utils');

// 创建Express应用
const app = express();

// 中间件设置
app.use(cors()); // 允许跨域请求
app.use(bodyParser.json({ limit: '50mb' })); // 增加请求体大小限制，处理大型内容

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).send({ 
    status: 'OK',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// === HTML与JSON之间的转换 ===

// HTML转JSON端点
app.post('/html-to-json', async (req, res) => {
  const startTime = Date.now();
  try {
    const { html } = req.body;
    
    if (!html) {
      return res.status(400).json({ 
        success: false, 
        error: 'HTML content is required' 
      });
    }
    
    const editor = createEditor();
    editor.commands.setContent(html, true); // true参数表示内容是HTML
    const tiptapJson = editor.getJSON();
    editor.destroy();
    
    const processingTime = Date.now() - startTime;
    
    return res.status(200).json({
      success: true,
      data: tiptapJson,
      meta: {
        processingTimeMs: processingTime,
        inputType: 'html',
        outputType: 'json'
      }
    });
    
  } catch (error) {
    console.error('HTML to JSON conversion error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// JSON转HTML端点
app.post('/json-to-html', async (req, res) => {
  try {
    const { json } = req.body;
    
    if (!json) {
      return res.status(400).json({ 
        success: false, 
        error: 'JSON content is required' 
      });
    }
    
    const editor = createEditor();
    editor.commands.setContent(json);
    const html = editor.getHTML();
    editor.destroy();
    
    return res.status(200).json({
      success: true,
      data: html,
      meta: {
        inputType: 'json',
        outputType: 'html'
      }
    });
    
  } catch (error) {
    console.error('JSON to HTML conversion error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === HTML与Markdown之间的转换 ===

// HTML转Markdown端点
app.post('/html-to-markdown', async (req, res) => {
  try {
    const { html } = req.body;
    
    if (!html) {
      return res.status(400).json({ 
        success: false, 
        error: 'HTML content is required' 
      });
    }
    
    // 使用turndown将HTML转换为Markdown
    const markdown = htmlToMarkdown(html);
    
    return res.status(200).json({
      success: true,
      data: markdown,
      meta: {
        inputType: 'html',
        outputType: 'markdown'
      }
    });
    
  } catch (error) {
    console.error('HTML to Markdown conversion error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Markdown转HTML端点
app.post('/markdown-to-html', async (req, res) => {
  try {
    const { markdown } = req.body;
    
    if (!markdown) {
      return res.status(400).json({ 
        success: false, 
        error: 'Markdown content is required' 
      });
    }
    
    // 使用markdown-it将Markdown转换为HTML
    const html = markdownToHtml(markdown);
    
    return res.status(200).json({
      success: true,
      data: html,
      meta: {
        inputType: 'markdown',
        outputType: 'html'
      }
    });
    
  } catch (error) {
    console.error('Markdown to HTML conversion error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === JSON与Markdown之间的转换（通过HTML作为中间格式）===

// JSON转Markdown端点
app.post('/json-to-markdown', async (req, res) => {
  try {
    const { json } = req.body;
    
    if (!json) {
      return res.status(400).json({ 
        success: false, 
        error: 'JSON content is required' 
      });
    }
    
    // 步骤1: JSON -> HTML
    const editor = createEditor();
    editor.commands.setContent(json);
    const html = editor.getHTML();
    editor.destroy();
    
    // 步骤2: HTML -> Markdown
    const markdown = htmlToMarkdown(html);
    
    return res.status(200).json({
      success: true,
      data: markdown,
      meta: {
        inputType: 'json',
        outputType: 'markdown'
      }
    });
    
  } catch (error) {
    console.error('JSON to Markdown conversion error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Markdown转JSON端点
app.post('/markdown-to-json', async (req, res) => {
  try {
    const { markdown } = req.body;
    
    if (!markdown) {
      return res.status(400).json({ 
        success: false, 
        error: 'Markdown content is required' 
      });
    }
    
    // 步骤1: Markdown -> HTML
    const html = markdownToHtml(markdown);
    
    // 步骤2: HTML -> JSON
    const editor = createEditor();
    editor.commands.setContent(html, true); // true表示内容是HTML
    const json = editor.getJSON();
    editor.destroy();
    
    return res.status(200).json({
      success: true,
      data: json,
      meta: {
        inputType: 'markdown',
        outputType: 'json'
      }
    });
    
  } catch (error) {
    console.error('Markdown to JSON conversion error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 处理不存在的路由
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TipTap conversion service running on http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Available conversions: HTML<->JSON, HTML<->Markdown, JSON<->Markdown`);
});