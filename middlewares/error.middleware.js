const errorMiddleware = (err, _req, res, next) => {
    console.log(err.message || "Internal Server Error")
    res.status(err.code || 500).json({
      success: false,
      message: err.message
    })
  }

  export default errorMiddleware;