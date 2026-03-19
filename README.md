# 클론코딩 프로젝트 - 1
### 따라하며 배우는 노드, 리액트 시리즈 - 챗봇 사이트 만들기 (인프런 강의)
<img width="2142" height="773" alt="스크린샷 2026-03-16 053817" src="https://github.com/user-attachments/assets/f712a8f1-04dd-4be7-aaa3-ff455733659c" />


## Architecture
<img width="1325" height="949" alt="image" src="https://github.com/user-attachments/assets/1bfdf0e3-ff13-44e4-b75f-a0861ab7052d" />

- Frontend : React
- Backend : Node.js

## 프로젝트 구조 설명
<img width="1241" height="777" alt="image" src="https://github.com/user-attachments/assets/60b9b61e-3d41-4692-8a4d-743cf72b040f" />

- backend
  - 환경 변수와 설정 파일을 config 파일에 별도 관리함 (*gitignore를 작업하지 않은 상태이니 반드시 주의해주시기 바랍니다!)
  - Dialogflow.js에서 호출할 쿼리에 대한 내용 작성 (강의대로 eventQuary와 textQuary가 구현되어 있음)
  - Dialogflow에서 요구하는 json 형식을 맞추기 위해 structjson을 거쳐서 Dialogflow로 보내지는 방식임
 
- frontend
  - Chatbot.jsx에서 채팅 기능에 대한 UI와 로직이 작성되어 있음
  - Sections에서 필요한 컴포넌트들을 만든 후 Chatbot에서 합쳐지는 방식임
 
  
