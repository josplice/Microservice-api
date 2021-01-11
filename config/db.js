const mongoos = require('mongoose')

const connectDB = async () => {
	const conn = await mongoos.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useUnifiedTopology: true,
	})
	console.log(`MongoDB connected: ${conn.connection.host}`.blue.underline)
}

module.exports = connectDB
