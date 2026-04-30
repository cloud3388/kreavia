import https from 'https';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dna } = req.body;
  if (!dna) {
    return res.status(400).json({ error: 'Missing brand dna context' });
  }

  const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!groqKey) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY or VITE_GROQ_API_KEY in environment' });
  }

  const prompt = `You are a viral content strategist and creative director.
Create a comprehensive content strategy and social media templates for this brand:
Brand Name: ${dna.brand_name}
Niche: ${dna.niche}
Audience: ${dna.audience}
Style: ${dna.style}
Brief: ${dna.brief}

Output ONLY valid JSON matching this exact structure:
{
  "contentIdeas": [
    {
      "title": "Eye-catching title for the content piece",
      "hook": "A scroll-stopping opening sentence",
      "format": "reel" | "carousel" | "story",
      "angle": "educational" | "inspirational" | "controversial" | "lifestyle"
    }
  ],
  "templates": [
    {
      "type": "instagram_post",
      "name": "Primary Value Post",
      "text": "The main headline or quote for the graphic",
      "canvas": "1080x1080"
    },
    {
      "type": "reel_cover",
      "name": "Reel Cover",
      "text": "A massive, bold title for a short-form video",
      "canvas": "1080x1920"
    },
    {
      "type": "story",
      "name": "Engagement Story",
      "text": "An interactive question or poll text",
      "canvas": "1080x1920"
    }
  ],
  "hashtags": [
    {
      "tag": "#ExactHashtagWithHash",
      "category": "large" | "medium" | "small",
      "reach_est": 500000
    }
  ]
}

Make sure you generate exactly 5 varied contentIdeas, precisely 3 templates (one of each type), and exactly 10 highly relevant hashtags.`;

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[content-gen] Groq Error:', err);
      return res.status(response.status).json({ error: 'Groq API error' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[content-gen] Failed to generate Content:', error);
    
    // Very basic fallback
    return res.status(200).json({
      contentIdeas: [
        { title: `3 secrets about ${dna.niche}`, hook: "Want to know how?", format: "reel", angle: "educational" }
      ],
      templates: [
        { type: "instagram_post", name: "Value Post", text: `A new approach to ${dna.niche}`, canvas: "1080x1080" },
        { type: "reel_cover", name: "Cover", text: "THE TRUTH", canvas: "1080x1920" },
        { type: "story", name: "Poll", text: "Do you agree?", canvas: "1080x1920" }
      ],
      hashtags: [
        { tag: `#${dna.niche.replace(/\s+/g, '')}`, category: "large", reach_est: 1000000 }
      ]
    });
  }
}
