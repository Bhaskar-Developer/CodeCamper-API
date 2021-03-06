const path = require('path')
const express = require('express')
const dotenv = require('dotenv')
//const logger = require('./middlewares/logger')
const morgan = require('morgan')
const colors = require('colors')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')
const helmet = require('helmet')
const fileupload = require('express-fileupload')
const cookieParser = require('cookie-parser')
const errorHandler = require('./middlewares/error')
const connectDB = require('./config/db')

// Load Environment Variables
dotenv.config({ path: './config/config.env' })

//Connect to Remote MongoDB Database
connectDB()

//Load Route Files
const bootcamps = require('./routes/bootcamps')
const courses = require('./routes/courses')
const auth = require('./routes/auth')
const admin = require('./routes/admin')
const reviews = require('./routes/reviews')

const app = express()

//Body parser i.e. show JSON body
app.use(express.json())

//Cookie parser
//This is used to send the token in a cookie to the client
app.use(cookieParser())

//Use morgan to log the request along with the route
//This will run only when the server is running in Development mode
if(process.env.NODE_ENV === 'Development') {
  app.use(morgan('dev'))
}

//Set up Static folder
app.use(express.static(path.join(__dirname, 'public')))

//Support for file uploads - Mainly used to upload photo for a Bootcamp
app.use(fileupload())

//Sanitize data
app.use(mongoSanitize())

//Use Security Headers
app.use(helmet())

//Prevent XSS attacks
app.use(xss())

//Rate Limiting
const limiter = rateLimit({
  //allow 100 requests per 10 minutes
  windowMs: 10 * 60 * 1000, 
  max: 100
})
app.use(limiter)

//prevent HTTP paramater pollution
app.use(hpp())

//Allow CORS
app.use(cors())

//Mount Routes
app.use('/api/v2/bootcamps', bootcamps)
app.use('/api/v2/courses', courses)
app.use('/api/v2/auth', auth)
app.use('/api/v2/users', admin)
app.use('/api/v2/reviews', reviews)

//using Custom Error Handler
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(
  PORT, 
  console.log(`Server running in ${process.env.NODE_ENV} mode on Port ${PORT}`.yellow.bold)
)

//Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err}`.red.bold)
  //Crash the Application i.e. close server and exit application
  server.close(() => process.exit(1))
})