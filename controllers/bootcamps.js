const ErrorResponse = require('../utils/errorResponse')
const geocoder = require('../utils/geocoder')
const Bootcamp = require('../models/Bootcamp')
const asyncHandler = require('../middleware/async')
const path = require('path')

// @desc      Get all bootcamps
// @route     GET /api/v1/bootcamps
// @access    Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
	res.status(200).json(res.advancedResults)
})

// @desc      Get single bootcamp
// @route     GET /api/v1/bootcamps/:id
// @access    Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id)

	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id: ${req.params.id}`, 404),
		)
	}
	res.status(200).json({
		success: true,
		data: bootcamp,
	})
})

// @desc      Create a new bootcamp
// @route     POST /api/v1/bootcamps
// @access    Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
	//Add user to req.body to create a relationship between user and bootcamp
	req.body.user = req.user.id

	//Check for published bootcamp
	const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id })

	//if the user is not an admin they can only add one bootcamp
	if (publishedBootcamp && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`the User with id: ${req.user.id} has already published a bootcamp`,
				400,
			),
		)
	}

	const bootcamp = await Bootcamp.create(req.body)

	res.status(201).json({
		success: true,
		data: bootcamp,
	})
})

// @desc      Update a bootcamp
// @route     PUT /api/v1/bootcamps/:id
// @access    Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
	let bootcamp = await Bootcamp.findById(req.params.id)

	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id: ${req.params.id}`, 404),
		)
	}

	//Make sure user is bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`User ${req.user.id} is not authorised to update this bootcamp`,
				401,
			),
		)
	}
	bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	})

	res.status(200).json({
		success: true,
		data: bootcamp,
	})
})

// @desc      Delete a bootcamp
// @route     DELETE /api/v1/bootcamps/:id
// @access    Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id)

	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id: ${req.params.id}`, 404),
		)
	}

	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`User ${req.user.id} is not authorised to delete this bootcamp`,
				401,
			),
		)
	}

	bootcamp.remove()

	res.status(200).json({
		success: true,
		data: {},
	})
})

// @desc      Get bootcamp within a radius
// @route     GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access    Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
	const { zipcode, distance } = req.params

	// Get lat/lng from geocoder
	const loc = await geocoder.geocode(zipcode)
	const lat = loc[0].latitude
	const lng = loc[0].longitude

	//calc radius using radians
	//divide distance by radius of earth
	//raduis of earth = 3963 mi / 6378 km
	const radius = distance / 6378

	const bootcamps = await Bootcamp.find({
		location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
	})
	res.status(200).json({
		success: true,
		count: bootcamps.length,
		data: bootcamps,
	})
})

// @desc      Upload a photo for bootcamp
// @route     PUT /api/v1/bootcamps/:id/photo
// @access    Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id)

	if (!bootcamp) {
		return next(
			new ErrorResponse(`Bootcamp not found with id: ${req.params.id}`, 404),
		)
	}

	//make sure it is the bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`User ${req.user.id} is not authorised to update this bootcamp`,
				401,
			),
		)
	}

	if (!req.files) {
		return next(new ErrorResponse(`Please upload a file`, 404))
	}
	console.log(req.files)
	const file = req.files.file

	// Make sure the image is a photo
	if (!file.mimetype.startsWith('image')) {
		return next(new ErrorResponse(`Please upload an image file`, 404))
	}

	//check filesize
	if (file.size > process.env.MAX_FILE_UPLOAD) {
		return next(
			new ErrorResponse(
				`Please upload an image file less ${process.env.MAX_FILE_UPLOAD}`,
				404,
			),
		)
	}
	//Create custom file name
	file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

	file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
		if (err) {
			console.error(err)
			return next(new ErrorResponse(`Problem with file upload`, 500))
		}
		await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })

		res.status(200).json({
			success: true,
			data: file.name,
		})
	})
})
