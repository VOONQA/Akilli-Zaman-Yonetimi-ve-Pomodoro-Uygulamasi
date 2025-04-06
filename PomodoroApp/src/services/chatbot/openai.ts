import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateResponse = async (message: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Sen bir sohbet asistanısın ve aynı zamanda Pomodoro uygulaması hakkında bilgi sahibisin. Hem günlük konularda sohbet edebilir, hem de Pomodoro tekniği konusunda yardımcı olabilirsin. Kullanıcıyla doğal ve samimi bir şekilde konuş."
        },
        { role: "user", content: message }
      ],
      max_tokens: 250,
      temperature: 0.8,
    });

    return completion.choices[0]?.message?.content || 'Üzgünüm, bir yanıt oluşturulamadı.';
  } catch (error) {
    throw error;
  }
};
