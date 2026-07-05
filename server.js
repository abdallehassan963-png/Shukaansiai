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
2. Ka s
