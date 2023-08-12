
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        next(error)
    }
}

// function asyncHandler(fn) {
//              return async function(req, res, next){
//                 try {
//                     await fn(req, res, next)
//                 } catch (error) {
                    
//                 }
//     }
// }

export default asyncHandler;