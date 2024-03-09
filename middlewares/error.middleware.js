const errorMiddleware = (err, _req, res, next) => {
    console.log(err.message || "Internal Server Error")
    res.status(err.code === 11000 ? 500 : err.code || 500).json({
      success: false,
      message: err.code === 11000 ? "item alreade exist" : err.message
    })
  }

  export default errorMiddleware;