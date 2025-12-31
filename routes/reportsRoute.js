import express from "express"
import { connectMongo } from "../DB/connection.js"
import { ObjectId } from "mongodb"

export const reportsRoute = express.Router()

const db = await connectMongo(
        process.env.MONGO_URI, 
        process.env.DB_NAME)

reportsRoute.post("/", async (req, res) => {
    const requiredFields = ["fieldCode", "location", "threatLevel", "description", "timestamp", "confirmed"]
    if (req.body
        && Object.keys(req.body).every(key => requiredFields.includes(key))
        && Object.keys(req.body).length >= 4
        && typeof req.body.fieldCode === "string" 
        && typeof req.body.location === "string" 
        && typeof req.body.threatLevel === "number" 
        && typeof req.body.description === "string" 
        && req.body.threatLevel <= 5
        && req.body.threatLevel >= 1) {
        if (req.body.timestamp && req.body.confirmed && typeof req.body.confirmed === "boolean" && Object.keys(req.body).length === 6){
            const result  = await db.collection("intel_reports").insertOne(req.body)
            res.status(200).json({id: result.insertedId})
        } else if (req.body.timestamp && Object.keys(req.body).length === 5) {
            const newReport = req.body
            newReport.confirmed = false
            const result  = await db.collection("intel_reports").insertOne(newReport)
            res.status(200).json({id: result.insertedId})
        } else if (req.body.confirmed && typeof req.body.confirmed === "boolean" && Object.keys(req.body).length === 5) {
            const newReport = req.body
            newReport.timestamp = new Date().toISOString()
            const result  = await db.collection("intel_reports").insertOne(newReport)
            res.status(200).json({id: result.insertedId})
        } else {
            const newReport = req.body
            newReport.confirmed = false
            newReport.timestamp = new Date().toISOString()
            const result  = await db.collection("intel_reports").insertOne(newReport)
            res.status(200).json({id: result.insertedId})
        }
    } else {
        res.status(400).send("Missing data")
    }
})

reportsRoute.get("/", async (req, res) => {
    const result  = await db.collection("intel_reports").find().toArray()
    res.status(200).json({result})
})

reportsRoute.get("/high", async (req, res) => {
    const result  = await db.collection("intel_reports").find({threatLevel: {$gte : 4}}).toArray()
    res.status(200).json({result})
})

reportsRoute.put("/:id/confirm", async (req, res) => {
    const {id} = req.params
    if (id.length === 24){
        await db.collection("intel_reports").updateOne({_id: new ObjectId(id)}, {$set: {confirmed: true}})
        const result  = await db.collection("intel_reports").find({_id: new ObjectId(id)}).toArray()
        if (result.length > 0){
            res.status(200).json(result)
        }
    } else {
        res.status(404).send(`id: [${id}] not found`)
    }
})

reportsRoute.delete("/:id", async (req, res) => {
    const {id} = req.params
    if (id.length === 24){
        const result  = await db.collection("intel_reports").find({_id: new ObjectId(id)}).toArray()
        if (result.length > 0){
            await db.collection("intel_reports").deleteOne({_id: new ObjectId(id)})
            return res.status(200).send("Deleted successfully")
        }
    } 
    res.status(404).send(`id: [${id}] not found`)
    
})

reportsRoute.get("/byID/:id", async (req, res) => {
    const {id} = req.params
    if (id.length === 24){
        const result  = await db.collection("intel_reports").find({_id: new ObjectId(id)}).toArray()
        if (result.length > 0){
            return res.status(200).json(result)
        }
    } 
        res.status(404).send(`id: [${id}] not found`)
})

reportsRoute.get("/agent/:fieldCode", async (req, res) => {
    const {fieldCode} = req.params
    const result  = await db.collection("intel_reports").find({fieldCode:fieldCode}).toArray()
    if (result.length > 0){
            res.status(200).json(result)
    } else {
        res.status(404).send(`fieldCode: [${fieldCode}] not found`)
    }
})

reportsRoute.get("/stats", async (req, res) => {
    const all = await db.collection("intel_reports").find().toArray()
    const high = await db.collection("intel_reports").find({threatLevel: {$gte : 4}}).toArray()
    const confirmed = await db.collection("intel_reports").find({confirmed: true}).toArray()
    res.status(200).json({
        "all reports": all.length,
        "high reports": high.length,
        "confirmed reports": confirmed.length
    })
})
