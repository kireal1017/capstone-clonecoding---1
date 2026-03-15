// 앱이 실행되는 환경의 위치에 따라서 설정 파일 연결
// 개발 환경일 때는 dev.js, 배포 환경일 때는 prod.js

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./prod');
} else {
    module.exports = require('./dev');
}