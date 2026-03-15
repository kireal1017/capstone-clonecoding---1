import React, { useEffect } from 'react';
import Axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { saveMessage } from '../_actions/message_actions';
import Message from './Sections/Message';

import { List, Avatar } from 'antd';
import { RobotOutlined, SmileOutlined } from '@ant-design/icons';
import Card from "./Sections/Card";


function Chatbot() {
    const dispatch = useDispatch();
    const messagesFromRedux = useSelector(state => state.message.messages)

    useEffect(() => {

        eventQuery('WelcomeToMyWebsite')

    }, [])


    const textQuery = async (text) => {

        //  First  Need to  take care of the message I sent
        // 1. 우리가 보낸 메세지를 관리해야 됨

        // Dialogflow랑 동일한 형식을 갖춤
        let conversation = {
            who: 'user',
            content: {
                text: {
                    text: text
                }
            }
        }

        dispatch(saveMessage(conversation))
        // console.log('text I sent', conversation)

        // We need to take care of the message Chatbot sent 
        // 2. 챗봇이 보낸 메세지를 관리해야 됨

        const textQueryVariables = {
            text
        }
        try {
            //I will send request to the textQuery ROUTE 
            // 백엔드 서버로 텍스트 쿼리를 보냄

            const response = await Axios.post('/api/dialogflow/textQuery', textQueryVariables)

            for (let content of response.data.fulfillmentMessages) {        //챗봇에서 리턴 받은 데이터 중 text 부분만 추출

                conversation = {
                    who: 'bot',
                    content: content
                }

                dispatch(saveMessage(conversation))
            }


        } catch (error) {
            conversation = {
                who: 'bot',
                content: {
                    text: {
                        text: " Error just occured, please check the problem"
                    }
                }
            }

            dispatch(saveMessage(conversation))


        }

    }


    const eventQuery = async (event) => {

        // We need to take care of the message Chatbot sent 
        const eventQueryVariables = {
            event
        }
        try {
            //I will send request to the textQuery ROUTE 
            const response = await Axios.post('/api/dialogflow/eventQuery', eventQueryVariables)
            for (let content of response.data.fulfillmentMessages) {

                let conversation = {
                    who: 'bot',
                    content: content
                }

                dispatch(saveMessage(conversation))
            }


        } catch (error) {
            let conversation = {
                who: 'bot',
                content: {
                    text: {
                        text: " Error just occured, please check the problem"
                    }
                }
            }
            dispatch(saveMessage(conversation))
        }

    }


    const keyPressHanlder = (e) => {
        if (e.key === "Enter") {
            if (!e.target.value) {
                return alert('공백으로 메세지를 전달할 수 없습니다.') //you need to type somthing first
            }

            //we will send request to text query route 
            // 입력한 값 + 텍스트 쿼리를 백엔드로 보냄
            textQuery(e.target.value)

            // 입력창 초기화
            e.target.value = "";
        }
    }

    const renderCards = (cards) => {
        // 카드 메세지 3개가 들어오는데, 이걸 하나씩 매핑하고 card.jsx에 가져가서 다시 만듬
        return (
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                {cards.map((card, i) => <Card key={i} cardInfo={card.structValue} />)}
            </div>
        )
    }


    const renderOneMessage = (message, i) => {
        console.log('message', message)

        // we need to give some condition here to separate message kinds 

        // template for normal text 
        // 봇이 일반 텍스트를 전송하면 이걸 사용해서 화면에 띄움 
        if (message.content && message.content.text && message.content.text.text) {

            let textData = message.content.text.text;
            let textString = Array.isArray(textData) ? textData[0] : textData;

            // 빈 문자열인 경우 무시
            if (!textString || textString.trim() === "") {
                return null;
            }

            return <Message key={i} who={message.who} text={textData} />
        }
        else if (message.content && message.content.payload && message.content.payload.fields && message.content.payload.fields.card) {

            const AvatarSrc = message.who === 'bot' ? <RobotOutlined /> : <SmileOutlined /> //유저와 봇에 따라 아바타 설정

            return (
                <div key={i}>
                    <List.Item style={{ padding: '1rem' }}>
                        <List.Item.Meta
                            avatar={<Avatar icon={AvatarSrc} />}
                            title={message.who}
                            description={renderCards(message.content.payload.fields.card.listValue.values)}
                        />
                    </List.Item>
                </div>
            )

        }






        // template for card message 




    }

    const renderMessage = (returnedMessages) => {

        if (returnedMessages) {
            return returnedMessages.map((message, i) => {
                return renderOneMessage(message, i);
            })
        } else {
            return null;
        }
    }


    return (
        <div style={{
            height: 700, width: 700,
            border: '3px solid black', borderRadius: '7px',
            overflow: 'hidden' // 이 div를 넘어가는 자식 요소 숨김 처리
        }}>
            <div style={{ height: 644, width: '100%', overflow: 'auto' }}>

                {renderMessage(messagesFromRedux)}

            </div>

            <input
                style={{
                    margin: 0, width: '100%', height: 50,
                    border: 'none', borderTop: '3px solid black',
                    padding: '5px 10px', fontSize: '1rem',
                    boxSizing: 'border-box' // 패딩이 너비(100%)에 포함되도록 설정
                }}
                placeholder="Send a message..."
                onKeyPress={keyPressHanlder}
                type="text"
            />

        </div>
    )
}

export default Chatbot;
