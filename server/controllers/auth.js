const User = require('../models/user');
const {hashPassword, comparePassword} = require("../helpers/auth");
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try{
        //1. destructure name, email , password, from req.body
        const {name, email, password } = req.body;

        //2. all fields require validation;
        if(!name.trim()){
            return res.json({error: "Name is required"});
        }
        if(!email){
            return res.json({error:"Email is required"});
        }
        if(!password || password.length < 6 || password.length > 16){
            return res.json({error: "Password must be at least 6 characters and long 16 characters"});
        }

        //3.check if email is taken
        const exitingUser = await User.findOne({email});
        if(exitingUser){
            return res.json({error: "Email is taken"});
        }

        // 4. hash password
        const hashedPassword = await hashPassword(password);


        //5. register user
        const user = await new User({
            name,
            email,
            password: hashedPassword,
        }).save();

        //6.create signed jwt
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        //7.send response
        res.json({
            user:{
                name: user.name,
                email: user.email,
                role:user.role,
                address:user.address,
            },
            token
        });
    } catch (error){
        console.log(error)
    }
}
 


exports.login = async (req, res) =>{
    try {
        //1. destructure name, email, password from req.body
        const {email, password} = req.body;

        //2. all fields require validation
        if(!email){
            return res.json({error: "Email is required"})
        }
        if(!password || password.length < 6){
            return res.json({error: "password must be 6 characters long"})
        }

        //3. check if email is taken
        const user = await User.findOne({email})
        if(!user){
            return res.json({error: "User not found"})
        } 
        //4. compare password
        const match = await comparePassword(password, user.password);
        if(!match){
            return res.json({error: "Invalid email or password"})
        }

        //5. create sign jwt
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: "7d", })

        //send respones
        res.json({
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                address: user.address
            },
            token,
        })
    } catch (error) {
        console.log(error)
    }
}

//secret route
exports.secret = async (req, res) =>{
    res.json({
        currentUser: req.user,
        massege: "admin successfully entered in the controller"
    })
}


exports.updateProfile = async (req, res) =>{
    try {
        const {name, password, address} = req.body;
        const user = await User.findById(req.user._id);

        //check password length
        if(password && password.length < 6){
            return res.json({
                error: "Password is required and should be  min 6 charecter long"
            })
        }

        //hash password 
        const hashedPassword = password ? await hashPassword(password) : undefined

        const updated = await User.findByIdAndUpdate(
            req.user._id,
            {
                name : name || user.name,
                password: hashedPassword || user.password,
                address: address || user.address,
            },
            {
                new : "true"
            }
        )
        
        updated.password = undefined;
        res.json(updated);
    } catch (error) {
        console.log(error);
    }
}