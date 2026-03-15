import React from "react";
import { createRoot } from "react-dom/client";              // React 18+ 으로 변경
import './index.css';
import App from "./App";

import Reducer from './_reducers';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise';
import { thunk } from 'redux-thunk';                        // 최신 redux-thunk import 규격
import { BrowserRouter } from "react-router-dom";

// antd CSS 임포트 삭제됨 (antd v5+ 자동적용)
// serviceWorker 삭제됨 (Vite 사용으로 불필요)
const createStoreWithMiddleware = applyMiddleware(promiseMiddleware, thunk)(createStore);

const store = createStoreWithMiddleware(
    Reducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ &&
    window.__REDUX_DEVTOOLS_EXTENSION__()
);

const root = createRoot(document.getElementById("root"));

root.render(
    <Provider store={store}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </Provider>
);