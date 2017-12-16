const express = require('express')
const app = express()
const path = require('path')
var multer = require('multer')
var fs = require("fs")
var bodyParser = require('body-parser')
var session = require('express-session')
var cookieParser = require('cookie-parser')

var upload = multer({ dest: '/tmp/' })

app.set('view engine', 'ejs')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser());
app.use(session({ secret: "user serect" }))


const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/user_db', {
    useMongoClient: true
})


mongoose.Promise = global.Promise

var userSchema = mongoose.Schema({
    FirstName: String,
    LastName: String,
    UserName: String,
    Email: String,
    Password: String,
    Image: String
});
var user = mongoose.model("user", userSchema)

app.get('/', function (req, res) {
    if (req.session.user) {
        res.render('home', {
            name: req.session.user.FirstName
        })
    } else if(req.session.admin){
        res.render('home', {
            name: 'admin'
        })
    }else {
        res.render('home', {
            name: ''
        })
    }
})

app.get('/admin', function(req, res){
    res.render('admin', {
        admin: req.session.admin
    })
})

app.get('/login', function (req, res) {
    res.render('login')
})

app.get('/register', function (req, res) {
    res.render('register')
})

app.get('/logout', function (req, res) {
    req.session.destroy(function () {
        console.log("user logged out.")
    });
    res.redirect('/');
})

app.get('/contact', function (req, res) {
    if (req.session.user) {
        res.render('contact')
    } else {
        res.redirect('/login')
    }
})

app.get('/userdetails', function (req, res) {
    res.render('userdetails', {
        firstname: req.session.user.FirstName,
        lastname: req.session.user.LastName,
        username: req.session.user.UserName,
        email: req.session.user.Email,
        image: req.session.user.Image
    })
})

app.get('/image', function (req, res) {
    res.sendFile(path.resolve('file/' + req.session.user.Image + '.jpg'))
})

// insert data into database
app.post('/submit', upload.single('file'), function (req, res) {
    console.log(req.file.filename)
    console.log(req.body.firstname)

    if (!req.body.firstname || !req.body.lastname || !req.body.username || !req.body.email || !req.body.password) {
        console.log('fill all field')
    } else {
        if (req.body.password == req.body.confirmpassword) {
            var newUser = new user({
                FirstName: req.body.firstname,
                LastName: req.body.lastname,
                UserName: req.body.username,
                Email: req.body.email,
                Password: req.body.password,
                Image: req.file.filename
            });

            newUser.save().then((err, user) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(user)
                }
            });
            res.redirect('/userdetails')
        }
    }

    var file = 'C:/code/express/Loginflow/file/' + req.file.filename + '.jpg';
    fs.rename(req.file.path, file, function (err) {
        if (err) {
            console.log(err)
            res.send(500)
        } else {
            res.json({
                message: 'File uploaded successfully',
                filename: req.file.filename
            });
        }
    });

})

//user authentication

app.post('/loginsubmit', function (req, res) {
    console.log(req.body)
    console.log(req.body.UserName)
    console.log(req.body.Password)
    if(req.body.UserName == 'admin'&& req.body.Password == 'admin'){
        user.find(function(err,result){
            req.session.admin = result
            res.redirect('/admin')
        })
    }else if (!req.body.UserName || !req.body.Password) {
            console.log('fill all field properly')
        } else {
            user.find({ UserName: req.body.UserName }, function (err, result) {
                console.log(result)
                console.log(result[0].Password)
                req.session.user = result[0]
                if (result[0].Password == req.body.Password) {
                    res.redirect('/userdetails')
                }
            })
        }
    
})


app.listen(5000, function () {
    console.log('response listening on port 5000')
})