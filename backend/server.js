const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

const uuid = require('uuid');


const config = require('./server/config/keys');

// 미들웨어 설정
app.use(cors()); // 프론트엔드(React)에서 오는 요청 허용
app.use(express.json()); // JSON 형태의 데이터 파싱
// 기본 라우트(API)
app.get('/', (req, res) => {
    res.send('챗봇 API 서버가 정상적으로 실행 중입니다!');
});

app.use('/api/dialogflow', require('./server/routes/dialogflow'));

// 서버 실행
app.listen(PORT, () => {
    console.log(`✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});