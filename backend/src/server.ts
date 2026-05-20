// 근거: docs/04-design/backend-spec.md §1 (server.ts — HTTP 서버 listen)
// app + env를 가져와 listen만 수행. 비즈니스 로직 없음.

import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`PlanMate backend listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
