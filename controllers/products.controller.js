const {Product} = require('../schemas/product');
const { Category } = require('../schemas/category');
const mongoose = require('mongoose');

class ProductController {
    
    async getProducts(req, res) {
        try {
            let filter = {};
            if(req.query.categories) {
                filter = {category: req.query.categories.split(',')}
            }
            const productList = await Product.find(filter).populate('category');
            if(!productList) 
            return res.status(500).json({success: false})

            res.send(productList);
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async getProduct(req, res) {
        try {
            const product = await Product.findById(req.params.id).populate('category');
            if(!product) {
                return res.status(500).json({success: false})
            }
            res.send(product);
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async createProduct(req, res) {
        try {
            const category = await Category.findById(req.body.category);
            if(!category) return res.status(400).send('Invalid Category')

            const file = req.file;
            if(!file) return res.status(400).send('No image in the request')
            
            const fileName = file.filename;
            const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
            
            let product = new Product({
                name: req.body.name,
                description: req.body.description,
                richDescription: req.body.richDescription,
                image: `${basePath}${fileName}`,
                images: req.body.images,
                brand: req.body.brand,
                price: req.body.price,
                category: req.body.category,
                countInStock: req.body.countInStock,
                rating: req.body.rating,
                numReviews: req.body.numReviews,
                isFeatured: req.body.isFeatured,
            })

            product = await product.save();

            if(!product) 
            return res.status(500).send('The product cannot be created')

            res.send(product);
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async updateProduct(req, res) {
        try {
            if(!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).send('Invalid Product Id')
             }
             const category = await Category.findById(req.body.category);
             if(!category) return res.status(400).send('Invalid Category');
         
             const product = await Product.findById(req.params.id);
             if(!product) return res.status(400).send('Invalid Product');
         
             const file = req.file;
             let imagepath;
         
             if(file) {
                 const fileName = file.filename;
                 const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
                 imagepath = `${basePath}${fileName}`;
             } else {
                 imagepath = product.image;
             }
         
             const updatedProduct = await Product.findByIdAndUpdate(
                 req.params.id,
                 {
                     name: req.body.name,
                     description: req.body.description,
                     richDescription: req.body.richDescription,
                     image: req.body.image,
                     brand: req.body.brand,
                     price: req.body.price,
                     category: req.body.category,
                     countInStock: req.body.countInStock,
                     rating: req.body.rating,
                     numReviews: req.body.numReviews,
                     isFeatured: req.body.isFeatured,
                 },
                 { new: true}
             )
         
             if(!product)
             return res.status(500).send('the product cannot be updated!')
         
             res.send(updatedProduct);
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async deleteProduct(req, res) {
        Product.findByIdAndRemove(req.params.id).then(product =>{
            if(product) {
                return res.status(200).json({success: true, message: 'the product is deleted!'})
            } else {
                return res.status(404).json({success: false , message: "product not found!"})
            }
        }).catch(err=>{
           return res.status(500).json({success: false, error: err}) 
        })
    }

    async getProductCount(req, res) {
        try {
            const productCount = await Product.countDocuments((count)=> count);
            if(!productCount) {
                return res.status(500).json({success: false});
            }
            res.send({
                productCount: productCount
            });
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async getFeaturedProducts(req, res) {
        try {
            const count = req.params.count ? req.params.count : 0;
            const products = await Product.find({isFeatured: true}).limit(+count);
            if(!products) {
                return res.status(500).json({success: false});
            }
            res.send(products);
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async updateGallery(req, res) {
        try {
            if(!mongoose.isValidObjectId(req.params.id)) {
                    return res.status(400).send('Invalid Product Id')
            }
            const files = req.files;
            let imagesPaths = [];
            const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        
            if(files) {
                files.map(file => {
                    imagesPaths.push(`${basePath}${file.filename}`);
                })
            }
        
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                {
                    images: imagesPaths
                },
                { new: true}
            )
        
            if(!product)
            return res.status(500).send('the product cannot be updated!')
        
            res.send(product);
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }
}

module.exports = new ProductController();