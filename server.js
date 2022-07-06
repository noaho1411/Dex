const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const app = express();
const fs = require('fs');
const session = require('express-session');
const path = require("path");


app.use(bodyParser.urlencoded({ extended: true })); 
app.use(fileUpload({ createParentPath: true }));
app.use(session({
	secret: "H*44%^^K7@6!yS8$",
	resave: false,
	saveUninitialized: false,
	cookie: { secure: false }
}));
app.set("view engine","ejs");
app.use("/uploads", express.static('uploads'));




//main page

app.get("/", (req, res) => {

	res.render("login");

})






//login request

app.post("/auth", (req, res) => {

	found=false;
	for (i in users){
		if (req.body.user==users[i].user){
			found=true;
			if (req.body.pass==users[i].pass){
				console.log(`\n[user <${users[i].user}> logged in]`);
				req.session.loggedin = true;
				req.session.uid = users[i].uid;

				res.render("home",{
					users:users,
					req:req
				});

			}
			else{
				console.log(`\n[failed login attempt: <${users[i].user}> incorrect password]`);
				res.send("try again");
				break;
			}

		}
	}
	if (found!==true){
		console.log(`\n[failed login attempt: <${req.body.user}> no such user exists]`);
		res.send("user does not exist");
	}

});

//each login cookie contains:

//		req.session.uid:: 			users id that is currently logged in
//		req.session.loggedin:: 		boolean logged in value

//cookie is destroyed when user logs out






//logout request

app.post("/logout", (req, res) => {
	logout(req,res);

});








//signup request

app.post("/signup", (req, res) => {
	var found = false
	for (i in users){
		if (req.body.user==users[i].user){
			found=true;
		}
	}
	if (!found){

		adduser(req.body.user,req.body.pass);
		res.send(`created new user ${req.body.user}`);
		console.log(`\n[user <${req.body.user}> just joined!]  `);
	}
	else{
		res.send("user already exists");
		console.log(`\n[user <${req.body.user}> already exists]  `);
	}

});








//image upload

app.post("/upload", async (req,res) => {
	if (checklogin(req,res)){
		try{
			if(!req.files) {
				res.send("no image attached");
			}
			else{
				res.send(req.files.post);



				let dir = `./uploads/${req.session.uid}`;
				fs.readdir(dir, (err,data) => {


					let imagemeta = {

						desc:req.body.desc,
						likes:[]

					}


					let meta = JSON.stringify(imagemeta);
					try{
						req.files.post.mv(`./uploads/${req.session.uid}/${(data.length+1)/2}${path.extname(req.files.post.name)}`);
						fs.writeFileSync(`./uploads/${req.session.uid}/${(data.length+1)/2}.json`, meta);
					} catch {
						req.files.post.mv(`./uploads/${req.session.uid}/0${path.extname(req.files.post.name)}`);
						fs.writeFileSync(`./uploads/${req.session.uid}/0.json`, meta);
					}
					console.log(`\n[user <${users[req.session.uid].user}> just posted!]  `)

				});

			}
		} catch (err) {
			res.status(500).send(err);
		}
	}
});








//delete user

app.post("/delete-user" , async (req,res) => {
	if (checklogin(req,res)){
		deluser(req.session.uid);
		console.log(`\n[deleted user <${req.session.uid}>]`);

		logout(req,res);
		res.render("login");
		fs.rmSync(`uploads/${req.session.uid}`, { recursive: true, force: true });
	}

});





//view users posts

app.post("/view", async (req,res) => {
	friend = req.body.friend;
	let images=[];
	let parsedData=[];
	let dir = `./uploads/${friend}`;
	fs.readdir(dir, (err,data) => {
		//console.log(data);

		for (x in data){
			if (path.extname(data[x])!==".json"){
				if (data[x]!==".DS_Store"){
					images.push(data[x]);
				}
			} else {
				meta = fs.readFileSync(`uploads/${friend}/${data[x]}`,{encoding:"utf8"});
				parsedData.push(meta);
			}
		}
		//console.log(`images: ${images}`)
		//console.log(`data: ${parsedData}`)

		let uid=req.session.uid;

		res.render("photos",{
			files:images.reverse(),
			meta:parsedData.reverse(),
			dir:dir,
			uid:uid,
			friend:friend
		});
		;
	})



});






//like post

app.post("/like", async (req,res) =>{

	let uid = req.session.uid
	let post = req.body.post
	let friend = req.body.friend
	let liked = false;

	

	let data = JSON.parse(fs.readFileSync(`uploads/${friend}/${parseInt(post)}.json`));
	


	for (x in data.likes){
		if (JSON.stringify([uid,users[uid].user]) == JSON.stringify(data.likes[x])){
			data.likes.splice(x,1);
			liked=true;
		} else{
			liked=false;
		}
	}

	if (liked == false){
		data.likes.push([uid,users[uid].user]);
		console.log(`\nuser <${users[uid].user}> unliked <${users[friend].user}>'s post.`)
	} else{
		console.log(`\nuser <${users[uid].user}> liked <${users[friend].user}>'s post.`)
	}

	fs.writeFileSync(`uploads/${friend}/${parseInt(post)}.json`, JSON.stringify(data));

	res.send("liked");
});





//async init users

fs.readFile("users.json", (err, data) => {
	if (err) throw err;
	users = JSON.parse(data);
	console.log("\n[users init].....DONE");
});

//data structure:

	//		array[

	//[00]	{user: "noah", pass: "password", uid: "000000000"},

	//[01]	{user: "admin", pass:"admin1", uid: "000000001"}

	//		]








//async start listener

const port = 8080;

app.listen(port, () => {
	console.log("\n[Server running on port 8080...]");
});







//logo

console.log("                        _____                    ");
console.log(" ____________      _____\\    \\ _____       _____ ");
console.log(" \\           \\    /    / |    |\\    \\     /    / ");
console.log("  \\           \\  /    /  /___/| \\    |   |    /  ");
console.log("   |    /\\     ||    |__ |___|/  \\    \\ /    /   ");
console.log("   |   |  |    ||       \\         \\    |    /    ");
console.log("   |    \\/     ||     __/ __      /    |    \\    ");
console.log("  /           /||\\    \\  /  \\    /    /|\\    \\   ");
console.log(" /___________/ || \\____\\/    |  |____|/ \\|____|  ");
console.log("|           | / | |    |____/|  |    |   |    |  ");
console.log("|___________|/   \\|____|   | |  |____|   |____|  ");
console.log("                       |___|/                    ");








//add user to json

function adduser(user,pass){
	let newuser = { 
		user: user,
		pass: pass, 
		uid:  users.length,
	};
	users.push(newuser);
	uwrite(users);
}




//delete user from json

function deluser(uid){
	users.splice(uid,1);
	for (let i=uid; i < users.length; i++){
		users[i].uid=parseInt(i);
	}
	uwrite(users);
}





//delete image

function deluser(uid,image){
	users.splice(uid,1);
	for (let i=uid; i < users.length; i++){
		users[i].uid=parseInt(i);
	}
	uwrite(users);
}




//commit list to users json

function uwrite(data){
	let sdata = JSON.stringify(data);
	fs.writeFileSync("users.json", sdata);
}




//get uid of user

function getuid(user){
	for (i in users){
		if (req.body.user==users[i].user){
			return parseInt(i);
		}
	}
}




//check if user is logged in

function checklogin(req,res){
	if (req.session.loggedin) {
		return true
	} else {
		res.render("login")
		return false
	}
}



function logout(req,res){
	try{console.log(`\n[user <${users[req.session.uid].user}> logging out]`);}
	catch (err) {err=null}
	req.session.destroy(function(err){
		if(err){
			console.log(err);
		}else{
			res.redirect("/");
			res.end();
		}
	});
}