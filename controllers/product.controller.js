import Product from "../models/product.schema.js";
import Collection from "../models/collection.schema.js";
import asyncHandler from "../services/asyncHandler.js";
import CustomError from "../utils/customError.js";
import formidable from "formidable";
import fs from "fs";
import { s3FileUpload, deleteFile } from "../services/fileUpload.js";
import mongoose from "mongoose";
import config from "../config/index.js";


/**********************************************************
 * @CREATE_PRODUCT
 * @route https://localhost:4000/api/product/create
 * @description Controller used for creating a new product
 * @description Uses AWS S3 Bucket for image upload
 * @returns Product Object
 *********************************************************/

export const createProduct = asyncHandler(async (req, res) => {
    const form = formidable({
        multiples: true,
        keepExtensions: true
    })

    form.parse(req, async (err, fields, files) => {
        if(err) {
            throw new CustomError(err.message || "error in form parsing", 500)
        }

        // return res.json({
        //     fields,
        //     files
        // })
        // generating a unique productId
        let productId = new mongoose.Types.ObjectId().toHexString()

        // checking for input fields
        if(!fields.name ||
            !fields.price ||
            !fields.sellingPrice ||
            !fields.description ||
            !fields.colourShown ||
            !fields.style ||
            !fields.sizes ||
            !fields.collectionId) {
            throw new CustomError("Fields are required", 500)
        }

        if(!files.files) {
            throw new CustomError("Photos are required", 500)
        }
        
        const now = new Date()
        // Promise.all() takes iterable of promises and return a single promise
        let imgUrlArrRes = Promise.all(
            // Object.values will return an array containing the values of the passed object
            // we have used async/await in the callback of the map, it will return array of promises
            Object.values(files.files).map(async(img, index) => {
                const imgData = fs.readFileSync(img.filepath)
                const upload = await s3FileUpload(
                    {
                        bucketName: config.S3_BUCKET_NAME,
                        key: `product/${productId}/img_${index + 1}`,
                        body: imgData,
                        contentType: img.mimetype
                        
                    }
                )
                if(upload){
                return {
                    secure_url: `https://${config.S3_BUCKET_NAME}.s3.amazonaws.com/product/${productId}/img_${index + 1}`
                }
            }
            })
        )

        let imgUrlArr = await imgUrlArrRes
        // add the product to db
        const product = await Product.create({
            ...fields,
            _id: productId,
            photos: imgUrlArr
        })

        if(!product) {
            // if product is not created remove the images form s3 bucket

            const arrLength = Object.values(files).length
            for (let index = 0; index < arrLength; index++) {
                deleteFile({
                    bucketName: config.S3_BUCKET_NAME,
                    key: `product/${productId}/img_${index + 1}`
                })
                
            }
            throw new CustomError("Error in adding Product", 400)
            

            // in the image, we have provided the key dynamically - (index + 1 )
            // to achieve that we have to get the length of the files array 
            // loop till the length of the array to generate the keys

        }
        return res.status(200).json({
            status: true,
            product
        })
    })
})


/**********************************************************
 * @UPDATE_PRODUCT
 * @route https://localhost:5000/api/getallproducts
 * @description Controller used for editing a product
 * @description Admin can edit the prduct
 * @returns Products Object
 *********************************************************/

export const updateProduct = asyncHandler(async (req, res) => {
    const {id} = req.params
    const {property, value} = req.body

    if(!(property && value)) {
        throw new CustomError("property and value is mandatory", 401)
    }
    
    const product = await Product.findById(id).populate("collectionId", "name")
    if(!product) {
        throw new CustomError("error in fetching the product", 401)
    }

    product[property] = value

    const updatedProduct = await product.save()

    if(!updatedProduct) {
        throw new CustomError("Failed in saving the product |update", 401)
    }

    res.status(200).json({
        success: true,
        updatedProduct
    })
})

/**********************************************************
 * @UPDATE_PRODUCT_IMAGE
 * @route https://localhost:4000/api/product/create
 * @description Controller used for creating a new product
 * @description Uses AWS S3 Bucket for image upload
 * @returns Product Object
 *********************************************************/

 export const updateProductImg = asyncHandler(async (req, res) => {
    const {id} = req.params

    const form = formidable({
        multiples: true,
        keepExtensions: true
    })

    let imgUrlArr = []

    form.parse(req, async (err, fields, files) => {
        if(err) {
            throw new CustomError(err.message || "error in form parsing", 500)
        }

        const removedImgArr = JSON.parse(fields.removedImg)
        if(removedImgArr.length){
            // delete the images
            await Promise.all(removedImgArr.map(async item => {
                // extract the key from the secure_url
                let url = item.secure_url
                let pathName = new URL(url).pathname
                let finalKey = pathName.substring(pathName.indexOf("product"))
                console.log(finalKey)
    
            await deleteFile({
                    bucketName: config.S3_BUCKET_NAME,
                    key: finalKey
                })
            }))
        }
       
        // handling the files
        let imgFiles = Object.values(files)


        if(imgFiles.length) {
            const now = new Date()
            imgUrlArr = await Promise.all(imgFiles.map(async (img, i) => {
                const imgData = fs.readFileSync(img.filepath)
                const upload = await s3FileUpload(
                    {
                        bucketName: config.S3_BUCKET_NAME,
                        key: `product/${id}/img_${now.getTime()}_${i}`,
                        body: imgData,
                        contentType: img.mimetype
                        
                    }
                )
                return {
                    secure_url: upload.Location
                }
            }))
        }
        
        const product = await Product.findById(id).populate("collectionId", "name")

        // add the newly added images url and remove the deleted one

        let result = removedImgArr.length ? [] : product.photos
        if(removedImgArr.length) {
            let previousImg = product.photos

            result = previousImg.filter(img => {
                let index = removedImgArr.findIndex(item => item.secure_url === img.secure_url)
                return index === -1
            })
        }

        product.photos = [...result, ...imgUrlArr]

        await product.save()

        if(!product) {
       
        throw new CustomError("Error in updating Product", 400)

        }
        return res.status(200).json({
        status: true,
        product
        })
       
    })
})

/**********************************************************
 * @GET_ALL_PRODUCTS
 * @route https://localhost:5000/api/getallproducts
 * @description Controller used for getting all products details
 * @description User and admin can get all the prducts
 * @returns Products Object
 *********************************************************/

export const getAllProducts = asyncHandler(async (_req, res) => {
    const products = await Product.find().sort({createdAt: "desc"})

    if(!products) {
        throw new CustomError("No product found in DB", 400)
    }

    return res.status(200).json({
        success: true,
        products
    })
})

/**********************************************************
 * @GET_LIMITED_PRODUCTS
 * @route https://localhost:5000/api/getlimitedproducts
 * @description Controller used for getting limited products
 * @description User and admin can get all the prducts
 * @returns Products Object
 *********************************************************/

 export const getLimitedProducts = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 9
    const skipCount = ( page - 1) * limit

    // sorting the array with _id: -1 to get the recently added product at the first position and so on.
    const products = await Product.find().sort({_id: -1}).skip(skipCount).limit(limit)

    if(!products) {
        throw new CustomError("No product found in DB", 400)
    }

    return res.status(200).json({
        success: true,
        products
    })
})
/**********************************************************
 * @GET_PRODUCTS_BY_CATEGORY
 * @route https://localhost:5000/api/getallproducts
 * @description Controller used for getting all products of a particular category
 * @description User and admin can get the prducts
 * @returns Products Object
 *********************************************************/

 export const getProductsByCategory = asyncHandler(async (req, res) => {
    const categoryId = req.params.category
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 12
    const skipCount = (page - 1) * limit

    if(!categoryId) {
        throw new CustomError("Please Provide the category Id", 401)
    }
    
    const products = await Product.find({collectionId: categoryId}).skip(skipCount).limit(limit)

    if(!products) {
        throw new CustomError("No product found in DB", 400)
    }

    return res.status(200).json({
        success: true,
        products
    })
})

/**********************************************************
 * @GET_PRODUCT_BY_ID
 * @route https://localhost:5000/api/product/:productId
 * @description Controller used for getting single product details
 * @description User and admin can get single product details
 * @returns Product Object
 *********************************************************/

export const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params

    const product = await Product.findById(productId).populate("collectionId", "name")

    if (!product) {
        throw new CustomError("No product was found", 404)
    }
    res.status(200).json({
        success: true,
        product
    })
})

/**********************************************************
 * @SEARCH
 * @route https://localhost:5000/api/product/search?q=query
 * @description Controller used for getting products based on the query
 * @returns Products Object
 *********************************************************/

export const getSearchedProducts = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q) {
      throw new CustomError('Please send the query', 400);
    }
    
    const regex = new RegExp(q, 'i');
    
    const products = await Product.find(
        {name: { $regex: regex }
    }).populate("collectionId", "name");
    
    if(!products.length) {
        throw new CustomError("No product found in db", 404)
    }

    return res.status(200).json({
        success: true,
        message: "products found in db",
        products
    })
})

/**********************************************************
 * @DELETE_PRODUCT
 * @route https://localhost:5000/api/product/delete/:id
 * @description Controller used for deleting products
 * @returns Products Object
 *********************************************************/

export const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params
    if(!id) {
        throw new CustomError("Please send the id", 401)
    }

    const product = await Product.findByIdAndDelete(id)

    if(!product) {
        throw new CustomError("product not deleted", 401)
    }
    res.status(200).json({
        success: true,
        message: "Product deleted",
        product
    })
})