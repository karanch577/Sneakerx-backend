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
        const filesArr = Array.isArray(files.files) ? files.files : [files.files];
        // Promise.all() takes iterable of promises and return a single promise
        let imgUrlArrRes = Promise.all(
            // Object.values will return an array containing the values of the passed object
            // we have used async/await in the callback of the map, it will return array of promises
            Object.values(filesArr).map(async(img, index) => {
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
            sizes: Object.values(fields.sizes),
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
            success: true,
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
    const {id: productId} = req.params;
    let imgUrlArr = []

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

        if(files.files) {
        const now = new Date()
        const filesArr = Array.isArray(files.files) ? files.files : [files.files];
        // Promise.all() takes iterable of promises and return a single promise
        let imgUrlArrRes = Promise.all(
            
            // we have used async/await in the callback of the map, it will return array of promises
            Object.values(filesArr).map(async(img, index) => {
                const imgData = fs.readFileSync(img.filepath)
                const upload = await s3FileUpload(
                    {
                        bucketName: config.S3_BUCKET_NAME,
                        key: `product/${productId}/img_updated_${index + 1}/${now.getTime()}`,
                        body: imgData,
                        contentType: img.mimetype
                        
                    }
                )
                if(upload){
                return {
                    secure_url: `https://${config.S3_BUCKET_NAME}.s3.amazonaws.com/product/${productId}/img_updated_${index + 1}/${now.getTime()}`
                }
            }
            })
        )

        imgUrlArr = await imgUrlArrRes
        }

        const product = await Product.findById(productId)
        if(!product) {
        throw new CustomError("error in fetching the product", 401)
        }

        product.name = fields.name;
        product.price = fields.price;
        product.sellingPrice = fields.sellingPrice;
        product.description = fields.description;
        product.colourShown = fields.colourShown;
        product.style = fields.style;
        product.sizes = fields.sizes;
        product.collectionId = fields.collectionId;
        product.photos = [...product.photos, ...imgUrlArr]
        product.sold = fields.sold ?? product.sold

        const savedProduct = await product.save()

        if(!savedProduct) {
            throw new CustomError("Error in saving the product", 400)
        }

        return res.status(200).json({
            success: true,
            product: savedProduct
        })
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

    if(!id) {
        throw new CustomError("productId is required", 400)
    }

    const { photos } = req.body;
    
    if(!photos || !photos.length) {
        throw new CustomError("Photos are required", 400)
    }

    await Promise.all(photos.map(async item => {
        // extract the key from the secure_url
        let url = item.secure_url
        let pathName = new URL(url).pathname
        let finalKey = pathName.substring(pathName.indexOf("product"))
        console.log("final key", finalKey)

    await deleteFile({
            bucketName: config.S3_BUCKET_NAME,
            key: finalKey
        })
    }))

    const product = await Product.findById(id).populate("collectionId", "name")

    // remove the deleted photos
    let updatedPhoto = product.photos.filter(photo => !photos.some(item => item.secure_url === photo.secure_url))

    product.photos = updatedPhoto;

    const updatedProduct = await product.save()

    if(!updatedProduct) {
    throw new CustomError("Error in updating Product", 400)
    }

    return res.status(200).json({
    success: true,
    product: updatedProduct
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

    if(products.length === 0) {
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

    // sorting the array with createdAt: -1 to get the recently added product at the first position and so on.
    const products = await Product.find().sort({ createdAt: -1 }).skip(skipCount).limit(limit)

    if(products.length === 0) {
        throw new CustomError("No product found in DB", 400)
    }

    const totalItem = await Product.countDocuments()

    return res.status(200).json({
        success: true,
        products,
        currentPage: +page,
        totalPage: Math.ceil(totalItem / limit)
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

    if(products.length === 0) {
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
        throw new CustomError("Error in product deletion", 401)
    }
    res.status(200).json({
        success: true,
        message: "Product deleted",
        product
    })
})