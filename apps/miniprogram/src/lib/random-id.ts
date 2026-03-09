const RANDOM_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const randomID = (length = 10) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += RANDOM_CHARS.charAt(Math.floor(Math.random() * RANDOM_CHARS.length));
  }
  return result;
};