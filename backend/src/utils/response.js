export const ok = (data = null) => ({ ok: true, data });

export const fail = (code, message, details) => {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  return { ok: false, error };
};

export const sendOk = (res, data, status = 200) => res.status(status).json(ok(data));

export const sendFail = (res, status, code, message, details) =>
  res.status(status).json(fail(code, message, details));

// 하위 호환
export const success = (res, data, status = 200) => sendOk(res, data, status);
