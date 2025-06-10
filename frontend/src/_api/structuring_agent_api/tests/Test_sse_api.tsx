import React, { useState } from 'react';

// 假设你的BaseSSEClient类已经导入
import { BaseSSEClient } from '../sse_api';


const SimpleSSETest: React.FC = () => {

  // const projectId = 'f6db0cbe-e7af-4300-8335-01ba4ffdbb93'

  const token = localStorage.getItem("token")
  console.log('token', {token})

  // const baseUrl = window.location.origin;
  // console.log('baseurl地址', {baseUrl})
  // const sseUrl = token ? `${baseUrl}/fastapi/api/v1/structuring/sse/${projectId}?token=${encodeURIComponent(token)}` : '';
  // console.log('sseUrl地址', {sseUrl})
  // console.log('sseUrl地址', sseUrl)   
  // console.log('sseUrl的类型',typeof sseUrl)


  // 使用useState来管理client实例，确保它不会在每次渲染时重新创建
  const [client] = useState<BaseSSEClient>(() => new BaseSSEClient());
  const [connected, setConnected] = useState<boolean>(false);
  const [url, setUrl] = useState<string>('');
  


  const handleConnect = (): void => {
    try {
      client.connect();
      setConnected(client.isConnected());
      console.log('连接后,马上查看isConnected, 结果是', client.isConnected())
      setUrl(client.getUrl() || '');

      console.log('需要通过监听器来判断')

      // 添加连接监听函数, 来监听连接的情况
      client.addOpenListener(() => {
        console.log('连接成功')
        setConnected(true)
        console.log('Connected状态设置为', connected)
      })

      // 添加错误监听函数, 来监听错误的情况
      client.addErrorListener((event: Event) => {
        console.error('SSE错误:', event);
      })

      // 添加消息监听函数, 来监听消息的情况   
      client.addEventListener('state_update', (event: MessageEvent) => {
        console.log('收到消息:', event.data);
      })



    } catch (error) {
      console.error('Connection failed:', error);
    }
  };


  const handleDisconnect = (): void => {
    client.close();
    console.log('执行了client.close()')
    setConnected(false)
    console.log('Connected状态设置为', connected)

    setUrl('');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h3>SSE Connection Test</h3>
      
      <div style={{ marginBottom: '10px' }}>
        Status: <strong>{connected ? 'Connected' : 'Disconnected'}</strong>
      </div>
      
      {url && (
        <div style={{ marginBottom: '10px' }}>
          URL: <code>{url}</code>
        </div>
      )}
      
      <button 
        onClick={handleConnect} 
        disabled={connected}
        style={{ marginRight: '10px', backgroundColor: 'green', color: 'white' }}
      >
        点击连接!
      </button>
      
      <button 
        onClick={handleDisconnect} 
        disabled={!connected}
        style={{ marginRight: '10px', backgroundColor: 'red', color: 'white' }}
      >
        点击断开!
      </button>
    </div>
  );
};

export default SimpleSSETest;