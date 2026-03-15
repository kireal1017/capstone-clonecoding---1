import React from 'react'
import { Card } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

const { Meta } = Card;

function CardComponent(props) {
    return (
        <div style={{ border: '2px solid #d3d3d38c', borderRadius: '10px' }}>
            <Card
                style={{ width: 260, minWidth: 260, flexShrink: 0 }}
                cover={
                    <img
                        alt={props.cardInfo.fields.description.stringValue}
                        src={props.cardInfo.fields.image.stringValue} />
                }
                actions={[
                    <a target="_blank" rel="noopener noreferrer" href={props.cardInfo.fields.link.stringValue}>
                        <EllipsisOutlined key="ellipsis" />
                    </a>
                ]}
            >
                <Meta
                    title={props.cardInfo.fields.stack.stringValue}
                    description={props.cardInfo.fields.description.stringValue}
                />

            </Card>
        </div>
    )
}

export default CardComponent
