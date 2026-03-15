import { useState } from 'react'
import './App.css'

import Chatbot from './Chatbot/Chatbot'

// 아이콘 관련 라이브러리
import { Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

const { Title } = Typography;

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <Title level={2} >Capstone design CHAT BOT APP&nbsp;<RobotOutlined /></Title>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>

        <Chatbot />

      </div>
    </div>
  )
}

export default App
