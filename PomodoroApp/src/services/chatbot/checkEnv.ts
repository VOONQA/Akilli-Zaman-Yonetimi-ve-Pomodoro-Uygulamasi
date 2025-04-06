import { OPENAI_API_KEY } from '@env';

export const checkApiKey = () => {
  console.log('API Key kontrolü:');
  if (!OPENAI_API_KEY) {
    console.error('API Key bulunamadı!');
    return false;
  }
  
  if (!OPENAI_API_KEY.startsWith('sk-')) {
    console.error('API Key geçersiz format! "sk-" ile başlamalı');
    return false;
  }
  
  console.log('API Key doğru formatta.');
  return true;
};
