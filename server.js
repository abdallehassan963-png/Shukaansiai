const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.static(path.join(__dirname, "public")));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64, mediaType, context, tone } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Sawir lama helin." });
    }
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Server-ku ma haysto OPENROUTER_API_KEY. Fadlan deji environment variable-ka." });
    }

    const toneInstruction = {
      dhiirran: "dhiirran, kalsooni leh, laakiin edeb iyo ixtiraam ku jira",
      qosol: "kaftan iyo qosol ku dheehan, fudud oo raaxo leh",
      fudud: "aad u fudud, sharaf leh, hooseeya ee aan wax badan sheegin",
    }[tone] || "dhiirran, kalsooni leh, laakiin edeb iyo ixtiraam ku jira";

    const systemPrompt = `Waxaad tahay kaaliye AI ah oo aad u yaqaan dhaqanka shukaansiga Soomaalida, waxaadna caawisaa dadka sheekaysiga shukaansiga (courtship) si dabiici ah, edeb leh, oo dhaqan ahaan habboon. Waxaa lagu siin doonaa screenshot ka mid ah sheekaysi WhatsApp ama chat kale ah.

Aqoonta dhaqameed ee aad isticmaali doonto:
- Shukaansiga Soomaalidu inta badan waa mid tartiib ah oo si tartiib ah u koraya — ma aha mid degdeg ah ama xad-dhaaf ah.
- Erayada qurux badan, murtida, iyo marmarka qaarkood tixraaca gabayada ama maahmaahyada ayaa qiimo weyn leh.
- Ixtiraanka, edebta, iyo tixgelinta qiyamka diinta iyo bulshada waa muhiim, laakiin taasi lama micno ahan in jawaabuhu ay noqdaan kuwo qallafsan ama aan dabiici ahayn.
- Qofka lagula sheekaysanayo waa in loo tixgeliyaa si xushmad leh, kalsooni iyo dabeecad wanaagsan ayaana la muujiyaa.

Shaqadaadu waa:
1. Aqoso sheekaysiga sawirka ku jira (qof kasta wuxuu qoray maxaa).
2. Ka soo saar SEDDEX (3) jawaab oo kala duwan oo lagu jawaabi karo fariinta ugu dambeysay, oo dhammaantood ku qoran Af-Soomaali oo ${toneInstruction}, iyagoo u dhigma dhaqanka shukaansiga Soomaalida sida kor lagu sharraxay.
3. Jawaabaha ha ahaadeen kuwo dabiici ah, gaagaaban (hal ama laba jumlo), aan la celcelin (repetitive).
4. HA KU DARIN wax faah faahin ah, sharraxaad, ama qoraal dheeraad ah. KELIYA soo celi JSON pure ah, sida tusaalahan, iyo waxba kale:
{"replies": ["jawaab 1", "jawaab 2", "jawaab 3"], "context_summary": "hal jumlo oo Af-Soomaali ah oo sharraxaysa waxa sheekaysigu ka hadlayo"}
Haddii sawirka aanu ahayn sheekaysi ama aanad wax ka fahmi karin, soo celi: {"replies": [], "context_summary": "Ma arki karo sheekaysi cad oo sawirka ku jira."}`;

    const userText = context && context.trim()
      ? `Macluumaad dheeraad ah oo aan bixiyay: ${context.trim()}`
      : "Sawirka falanqee oo jawaabo ii soo saar.";

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-maverick:free",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userText },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mediaType || "image/png"};base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.8,
          max_tokens: 1000,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API error:", data);
      return res.status(500).json({ error: data.error?.message || "OpenRouter API qalad ayey soo celisay." });
    }

    let raw = data.choices?.[0]?.message?.content || "";
    raw = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse failed:", raw);
      return res.status(500).json({ error: "Jawaabta AI-ga si sax ah looma fahmin. Isku day mar kale." });
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Wax baa qaldamay server-ka." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Shukaansi AI server running on port ${PORT}`));
