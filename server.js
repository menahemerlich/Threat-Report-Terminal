import express from "express"
import "dotenv/config"
import { reportsRoute } from "./routes/reportsRoute.js"

const app = express()
const PORT = process.env.PORT
app.use(express.json())
app.use("/reports", reportsRoute)


app.listen(PORT, () => {
    console.log(`Server running on http:localhost:${PORT}`);
});

