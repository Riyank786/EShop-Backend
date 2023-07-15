const {User} = require('../schemas/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserController {

    extractUser(req) {
        return new User({
            name: req.body.name,
            email: req.body.email,
            passwordHash: bcrypt.hashSync(req.body.password, 10),
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country,
        })
    }

    async getUsers(req, res) {
        try {
            const userList = await User.find().select('-passwordHash');
            if(!userList) {
                return res.status(500).json({success: false});
            } 
            res.send(userList);
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async getUserById(req, res) {
        try {
            const user = await User.findById(req.params.id).select('-passwordHash');
            if(!user) {
                return res.status(500).json({message: 'The user with the given ID was not found.'})
            } 
            res.status(200).send(user);
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async addUser(req, res) {
        try {
            let user = this.extractUser(req);
            user = await user.save();
        
            if(!user)
            return res.status(400).send('the user cannot be created!')
        
            res.send(user);
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async updateUser(req, res) {
        try {
            const userExist = await User.findById(req.params.id);
            let newPassword
            if(req.body.password) {
                newPassword = bcrypt.hashSync(req.body.password, 10)
            } else {
                newPassword = userExist.passwordHash;
            }

            const user = await User.findByIdAndUpdate(
                req.params.id,
                {
                    name: req.body.name,
                    email: req.body.email,
                    passwordHash: newPassword,
                    phone: req.body.phone,
                    isAdmin: req.body.isAdmin,
                    street: req.body.street,
                    apartment: req.body.apartment,
                    zip: req.body.zip,
                    city: req.body.city,
                    country: req.body.country,
                },
                { new: true}
            )

            if(!user)
            return res.status(400).send('the user cannot be created!')

            res.send(user);
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async userLogin(req, res) {
        try {
            const user = await User.findOne({email: req.body.email})
            const secret = process.env.secret;
            if(!user) {
                return res.status(400).send('The user not found');
            }

            if(user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
                const token = jwt.sign(
                    {
                        userId: user.id,
                        isAdmin: user.isAdmin
                    },
                    secret,
                    {expiresIn : '1d'}
                )
            
                res.status(200).send({user: user.email , token: token}) 
            } else {
                res.status(400).send('password is wrong!');
            }
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async userRegister(req, res) { 
        try {
            let user = this.extractUser(req);
            user = await user.save();
        
            if(!user)
            return res.status(400).send('the user cannot be created!')
        
            res.send(user);
        } catch (error) {
            res.status(500).json({success: false, message: error.message});
        }
    }

    async deleteUser(req, res) {
        User.findByIdAndRemove(req.params.id).then(user =>{
            if(user) {
                return res.status(200).json({success: true, message: 'the user is deleted!'})
            } else {
                return res.status(404).json({success: false , message: "user not found!"})
            }
        }).catch(err=>{
            return res.status(500).json({success: false, error: err}) 
        })
    }

    async getTotalUsers(req, res) {
        try {
            const userCount = await User.countDocuments((count) => count);
            if(!userCount) {
               return  res.status(500).json({success: false})
            } 
            res.send({ userCount });
        } catch (error) {
            return res.status(500).json({success: false, error: err}) 
        }
    }
}

module.exports = new UserController();