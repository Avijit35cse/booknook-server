import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express()
const port = process.env.PORT || 5000

//middlewares
app.use(cors())
app.use(express.json())

//Test route of server

app.get('/',(req,res)=>{
    res.send("BookNook server is running!")
})

//Start BookNook servermkdir src

app.listen(port,()=>{
    console.log(`BookNook server is running on port ${port}`);
})