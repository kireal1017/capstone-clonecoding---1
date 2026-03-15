import React from 'react'
import { List, Avatar } from 'antd';
import { RobotOutlined, SmileOutlined } from '@ant-design/icons';

function Message(props) {

    const AvatarSrc = props.who === 'bot' ? <RobotOutlined /> : <SmileOutlined />

    return (
        <List.Item style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
                <Avatar icon={AvatarSrc} />

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                        {props.who}
                    </div>
                    <div>
                        {props.text}
                    </div>
                </div>
            </div>
        </List.Item>
    )
}

export default Message
