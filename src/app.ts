import express from 'express'
import { sequelize } from './model'
import itemRoute from './routes/ItemRoutes'
import { handleErrors } from './middleware/errorHandler'
import rateLimit from 'express-rate-limit'

const app = express()

const port = process.env.PORT || 3000

const rateLimiter = rateLimit({
    windowMs: 20 * 60 * 1000,
    max: 100
})

app.use(rateLimiter) 
app.use(express.json())
app.use('', itemRoute)
app.use(handleErrors);

sequelize.sync().then(()=>{
    app.listen(port, ()=>{
        console.log(`Server running on port - ${port}`)
    })
})
.catch(err =>{
    console.log("Database Connection Error", err)
});