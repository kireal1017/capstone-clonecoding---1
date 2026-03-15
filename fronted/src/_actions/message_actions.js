import { SAVE_MESSAGE } from './types';

export function saveMessage(data) {
    return {
        type: SAVE_MESSAGE,
        payload: data
    }
}
