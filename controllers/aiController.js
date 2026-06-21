const { GoogleGenAI } = require("@google/genai");

exports.processAI = async (req, res) => {
  try {
    const { action, text, tone, targetLanguage, chatHistory } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, message: "Action is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: "Gemini API key is not configured on the server" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    let prompt = "";
    
    switch (action) {
      case "reply_generate": {
        if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
          return res.status(400).json({ success: false, message: "Chat history is required for reply generation" });
        }
        // Format chat history
        const formattedHistory = chatHistory
          .map(msg => `${msg.senderName || msg.sender}: ${msg.message}`)
          .join("\n");
        
        prompt = `You are a helpful chat assistant. Given the recent conversation history below, generate exactly 3 short, context-appropriate, natural quick replies.
Format your response strictly as a JSON array of strings, e.g. ["Reply 1", "Reply 2", "Reply 3"].
Do not wrap the response in markdown blocks (such as \`\`\`json) or include any introductory/concluding text.
Chat History:
${formattedHistory}`;
        break;
      }
      case "rewrite": {
        if (!text) {
          return res.status(400).json({ success: false, message: "Text is required for rewrite" });
        }
        prompt = `You are an expert editor. Rewrite the following text to improve clarity, flow, and match the specified tone.
Tone required: ${tone || 'Standard'}.
Original text: "${text}"
Output only the rewritten text, without any explanation, intro, or quotes.`;
        break;
      }
      case "translate": {
        if (!text || !targetLanguage) {
          return res.status(400).json({ success: false, message: "Text and targetLanguage are required for translation" });
        }
        prompt = `You are a professional translator. Translate the following text to ${targetLanguage}.
Original text: "${text}"
Output only the translated text, without any explanation, intro, or quotes.`;
        break;
      }
      case "grammar_fix": {
        if (!text) {
          return res.status(400).json({ success: false, message: "Text is required for grammar fix" });
        }
        prompt = `You are a grammar and spelling checker. Correct any grammar mistakes, spelling errors, or typos in the following text. Maintain the original tone and meaning.
Original text: "${text}"
Output only the corrected text. If there are no errors, return the original text exactly. Do not include any explanations.`;
        break;
      }
      case "code_generate": {
        if (!text) {
          return res.status(400).json({ success: false, message: "Description text is required for code generation" });
        }
        prompt = `You are an AI code generator. Generate a clean and well-structured code snippet based on the following description.
Description: "${text}"
Return only the code block. Use standard markdown code fencing (e.g. \`\`\`dart ... \`\`\`). Do not include any explanation or conversational text.`;
        break;
      }
      case "chat": {
        if (!text) {
          return res.status(400).json({ success: false, message: "Text is required for chat" });
        }
        
        let contents = [];
        if (chatHistory && Array.isArray(chatHistory)) {
          contents = chatHistory.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.message }]
          }));
        }
        
        contents.push({
          role: "user",
          parts: [{ text: text }]
        });
        
        const chatResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
            systemInstruction: "You are a helpful and intelligent AI Chat Assistant built into a high-end calling and chat application. Keep your responses engaging, friendly, and concise. Format lists or technical code using markdown when appropriate."
          }
        });
        
        return res.status(200).json({
          success: true,
          result: chatResponse.text.trim(),
        });
      }
      case "image_generate": {
        if (!text) {
          return res.status(400).json({ success: false, message: "Text (prompt) is required for image generation" });
        }
        try {
          const imgResponse = await ai.models.generateImages({
            model: "imagen-3.0-generate-002",
            prompt: text,
            config: {
              numberOfImages: 1,
              outputMimeType: "image/jpeg",
              aspectRatio: "1:1",
            }
          });
          
          if (imgResponse.generatedImages && imgResponse.generatedImages.length > 0) {
            const base64Image = imgResponse.generatedImages[0].image.imageBytes;
            return res.status(200).json({
              success: true,
              imageBase64: base64Image
            });
          }
          throw new Error("No images generated");
        } catch (imgErr) {
          console.warn("Imagen 3 generation failed, using Pollinations fallback:", imgErr.message);
          const fallbackUrl = `https://image.pollinations.ai/p/${encodeURIComponent(text)}?width=512&height=512&nologo=true`;
          return res.status(200).json({
            success: true,
            imageUrl: fallbackUrl
          });
        }
      }
      default:
        return res.status(400).json({ success: false, message: `Unsupported action: ${action}` });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let resultText = response.text || "";

    // Parse suggestions for reply_generate
    if (action === "reply_generate") {
      try {
        // Clean markdown JSON wrapper if present
        let cleaned = resultText.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```(json)?/, "").replace(/```$/, "").trim();
        }
        const suggestions = JSON.parse(cleaned);
        return res.status(200).json({
          success: true,
          suggestions,
        });
      } catch (parseError) {
        console.error("Failed to parse quick replies JSON:", resultText, parseError);
        // Fallback: split lines or comma if parsing failed
        const fallbackSuggestions = resultText
          .split(/[,\n]/)
          .map(s => s.replace(/^[-\d.\s"']+|["'\s]+$/g, "").trim())
          .filter(s => s.length > 0)
          .slice(0, 3);
        
        return res.status(200).json({
          success: true,
          suggestions: fallbackSuggestions,
        });
      }
    }

    res.status(200).json({
      success: true,
      result: resultText.trim(),
    });

  } catch (err) {
    console.error("AI Controller Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "An error occurred during AI processing",
    });
  }
};