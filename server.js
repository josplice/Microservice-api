const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const colors = require('colors')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/error')
const fileupload = require('express-fileupload')
const cookieParser = require('cookie-parser')
const path = require('path')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')

// Load env variables
dotenv.config({ path: './config/config.env' })

//Connect to database
connectDB()

//Route files
const bootcamps = require('./routes/bootcamps')
const courses = require('./routes/courses')
const auth = require('./routes/auth')
const users = require('./routes/users')
const reviews = require('./routes/reviews')

const app = express()

// body parser
app.use(express.json())

// Cookie Parser
app.use(cookieParser())

// Dev logging Middleware
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

//File uploading
app.use(fileupload())

//Sanitize data
app.use(mongoSanitize())

//Set security header
app.use(helmet())

//enble cors
app.use(cors())

//prevent cross-site scripting
app.use(xss())

//ratelimiting
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: 100,
})

app.use(limiter)

//prevent http param polution
app.use(hpp())

//Set static folder
app.use(express.static(path.join(__dirname, 'public')))

//Mount routers
app.use('/api/v1/bootcamps', bootcamps)
app.use('/api/v1/courses', courses)
app.use('/api/v1/auth', auth)
app.use('/api/v1/users', users)
app.use('/api/v1/reviews', reviews)

app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(
	PORT,
	console.log(
		`Server running in ${process.env.NODE_ENV} mode on port: ${PORT}`.cyan.bold,
	),
)

// handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
	console.log(`Error: ${err.message}`.red)
	//close server and exit
	server.close(() => process.exit(1))
})
