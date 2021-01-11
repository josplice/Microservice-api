const ErrorResponse = require('../utils/errorResponse')
const Course = require('../models/Course')
const Bootcamp = require('../models/Bootcamp')
const asyncHandler = require('../middleware/async')

// @desc      Get all courses
// @route     GET /api/v1/courses
// @route     GET /api/v1/bootcamps/:bootcampId/courses
// @access    Public
exports.getCourses = asyncHandler(async (req, res, next) => {
	if (req.params.bootcampId) {
		const courses = await Course.find({ bootcamp: req.params.bootcampId })

		return res.status(200).json({
			success: true,
			count: course.length,
			data: courses,
		})
	} else {
		res.status(200).json(res.advancedResults)
	}
})

// @desc      Get a single course
// @route     GET /api/v1/courses/:id
// @access    Public
exports.getCourse = asyncHandler(async (req, res, next) => {
	const course = await Course.findById(req.params.id).populate({
		path: 'bootcamp',
		select: 'name description',
	})

	if (!course) {
		return next(
			new ErrorResponse(`No course with the id of ${req.params.id}`),
			404,
		)
	}

	res.status(200).json({
		success: true,
		data: course,
	})
})

// @desc      add a course
// @route     POST /api/v1/bootcamps/:bootcampId/courses
// @access    Private
exports.addCourse = asyncHandler(async (req, res, next) => {
	req.body.bootcamp = req.params.bootcampId

	req.body.user = req.user.id

	const bootcamp = await Bootcamp.findById(req.params.bootcampId)

	if (!bootcamp) {
		return next(
			new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`),
			404,
		)
	}

	//make sure it is the course/bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`User ${req.user.id} is not authorised to add a course to bootcamp ${bootcamp._id}`,
				401,
			),
		)
	}

	const course = await Course.create(req.body)

	res.status(200).json({
		success: true,
		data: course,
	})
})

// @desc      update a course
// @route     PUT /api/v1/course/:id
// @access    Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
	let course = await Course.findById(req.params.id)

	if (!course) {
		return next(
			new ErrorResponse(`No course with the id of ${req.params.id}`),
			404,
		)
	}

	//make sure it is the course/bootcamp owner
	if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`User ${req.user.id} is not authorised to update a course ${course._id}`,
				401,
			),
		)
	}

	course = await Course.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	})

	res.status(200).json({
		success: true,
		data: course,
	})
})

// @desc      delete a course
// @route     DELETE /api/v1/course/:id
// @access    Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
	const course = await Course.findById(req.params.id)

	if (!course) {
		return next(
			new ErrorResponse(`No course with the id of ${req.params.id}`),
			404,
		)
	}

	//make sure it is the course/bootcamp owner
	if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`User ${req.user.id} is not authorised to delete a course ${course._id}`,
				401,
			),
		)
	}

	await course.remove()

	res.status(200).json({
		success: true,
		data: {},
	})
})