import OpenAI from 'openai';
import 'dotenv/config';

// Récupérer la clé d'API depuis les variables d'environnement
const openaiApiKey = process.env['OPENAI_API_KEY'];

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Exemple de requête à l'API d'OpenAI
// Remplacez le contenu des … "Résumez cet article : …" par un article trouvé sur internet
async function generateSummary() {

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{
      "role": "user",
      "content": "Donne moi les biensfaits du télétravail"
    }],
    max_tokens: 15,
  });

  console.log(response.choices[0].message.content.trim());
}

generateSummary();
