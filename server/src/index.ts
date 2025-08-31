import express from "express";
const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.get("/api/health", (_req, res) => {
res.send("OK -- no problems here!");
});

app.listen(PORT, () => {
console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
});

app.post("/api/create-room", (req, res) => {
    res.json({ code: "ABCD", clientId: "234" });
})