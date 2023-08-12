import mongoose from "mongoose";
import app from "./app.js";
import config from "./config/index.js";
// while using iife - all the require should have ; at the end

(async () => {
    try {
        await mongoose.connect(config.MONGODB_URL)
        console.log("DB connected")

        // the database is connected but we have a fatal error in the app
        app.on('error', (error) => {
            console.log("Error ", error)
        })

        const onListen = () => {
            console.log(`Server running on ${config.PORT}`)
        }
        app.listen(config.PORT, onListen)
        
    } catch (error) {
        console.log("Error in DB connection")
        console.log(error)
        throw error
    }
})()