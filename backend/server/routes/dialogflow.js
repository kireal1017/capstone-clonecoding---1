const express = require('express');
const router = express.Router();
const dialogflow = require('@google-cloud/dialogflow');
const { googleProjectID, dialogFlowSessionID, dialogFlowLanguageCode } = require('../config/keys');

// 세션 설정
const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.projectAgentSessionPath(googleProjectID, dialogFlowSessionID);


// 챗봇 API 라우트
router.post('/textQuery', async (req, res) => {

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: req.body.text,                          //유저 텍스트가 실제로 들어가는 곳
                languageCode: dialogFlowLanguageCode,
            },
        },
    };

    try {
        // Send request and log result
        const responses = await sessionClient.detectIntent(request);
        console.log('Detected intent');
        const result = responses[0].queryResult;
        console.log(`  Query: ${result.queryText}`);
        console.log(`  Response: ${result.fulfillmentText}`);

        res.send(result);
    } catch (error) {
        console.error('Dialogflow API 호출 오류:', error);
        res.status(500).send('챗봇 API 호출 실패');
    }
});

//event Query route
router.post('/eventQuery', async (req, res) => {

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            event: {
                name: req.body.event,                          //유저 텍스트가 실제로 들어가는 곳
                languageCode: dialogFlowLanguageCode,
            },
        },
    };

    try {
        // Send request and log result
        const responses = await sessionClient.detectIntent(request);
        console.log('Detected intent');
        const result = responses[0].queryResult;
        console.log(`  Query: ${result.queryText}`);
        console.log(`  Response: ${result.fulfillmentText}`);

        res.send(result);
    } catch (error) {
        console.error('Dialogflow API 호출 오류:', error);
        res.status(500).send('챗봇 API 호출 실패');
    }
});



module.exports = router;