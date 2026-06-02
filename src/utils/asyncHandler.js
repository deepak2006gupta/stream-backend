// const asyncHandler = (fn) => async(req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//         success: false,
//         message: error.message
//     });
//   }
// };

// export { asyncHandler };


// Alternative implementation using Promise.resolve



const asyncHandler = (asyncFn) =>{
    return (req, res, next) => {
        Promise.resolve(asyncFn(req, res, next)).catch(err => next(err));
    }
}

export { asyncHandler };