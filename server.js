const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const app = express();
const fs = require('fs');
const session = require('express-session');
const path = require("path");
const sharp = require("sharp");
const sizeOf = require('image-size')



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
app.use("/avatar", express.static('avatar'));
app.use(bodyParser.json());


global.actives=[]
let distance=10;
global.lldistance = distance*.0090210 //actual conversion rate is closer to .009013, 
									  //but I like the song by travis scott


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


				try{
					var data = JSON.parse(fs.readFileSync(`friends/${req.session.uid}/friends.json`));
				}catch (err){ var data = {confirmed:[]}}


				console.log(data.confirmed)
				res.render("home",{
					users:users,
					req:req,
					friends:data.confirmed
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

		let uid = adduser(req.body.user,req.body.pass);
		res.send(`created new user ${req.body.user}`);
		console.log(`\n[user <${req.body.user}> just joined!]  `);


		fs.mkdirSync(`uploads/${uid}`, { recursive: true }, (err) => {
			if (err) throw err;
		});

		fs.copyFileSync("default.jpeg",`uploads/${uid}/avatar.png`)


	}
	else{
		res.send("user already exists");
		console.log(`\n[user <${req.body.user}> already exists]  `);
	}

});





//recieve/respond location
app.post("/loc", (req,res)=>{
	
	let pos = req.body.pos;
	let nearby = [];

	console.log(`\n[user] <${users[req.session.uid].user}>:: `);
	console.log(req.body);
	console.log();

	let status=req.body.pos;
	let uid=req.session.uid

	if (!status == "left"){
		global.actives.splice(uid,1);
	} else{

		for (person in global.actives){
			if (parseInt(person)!==parseInt(uid)){

				let rise=(Math.abs(global.actives[person].lng)-Math.abs(status.lng));
				let run=(Math.abs(global.actives[person].lat)-Math.abs(status.lat));

				let distance = Math.sqrt((rise*rise)+(run*run));

				//pythag, maths extension top student #1

				if (distance < lldistance){
					nearby[person]=global.actives[person];
				}	

			}
		}

		global.actives[uid]=status;

	}

	res.send(nearby);
	for (x in nearby){
		console.log(x+"is nearby")
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
				try{
					var data = JSON.parse(fs.readFileSync(`friends/${uid}/friends.json`));
				}catch{ var data = {confirmed:[]}}
				res.render("home",{
					users:users,
					req:req,
					friends:data.confirmed
				});



				let dir = `./uploads/${req.session.uid}`;
				fs.readdir(dir, (err,data) => {


					let imagemeta = {

						desc:req.body.desc,
						likes:[]

					}

					let highest=0
					for (x in data){
						let temp=parseInt(path.parse(data[x]).name);
						if (temp > highest){
							highest=temp
						}
					}


					let meta = JSON.stringify(imagemeta);

					req.files.post.mv(`./uploads/${req.session.uid}/${highest+1}${path.extname(req.files.post.name)}`);
					fs.writeFileSync(`./uploads/${req.session.uid}/${highest+1}.json`, meta);
					
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
		let av = data.indexOf("avatar.png");
		data.splice(av,1);
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

		try{
			var data = JSON.parse(fs.readFileSync(`friends/${uid}/friends.json`));
			if (data.confirmed.includes(friend)){
				var friendstatus = true;
			}else{
				var friendstatus = false;
			}
		}catch{
			var friendstatus = false;
		}


		res.render("photos",{
			files:images.reverse(),
			meta:parsedData.reverse(),
			dir:dir,
			uid:uid,
			friend:friend,
			user:users[friend].user,
			friendstatus:friendstatus
		});
		;
	})



});



//add friend

app.post("/friend", async (req,res) => {

	let friend = req.body.friend.toString();
	let uid = req.session.uid.toString();


	try{
		var data = JSON.parse(fs.readFileSync(`friends/${uid}/friends.json`));
	}catch{
		let friends = {
			outgoing:[],
			confirmed:[],
			incoming:[]
		}
		fs.mkdirSync(`friends/${uid}`, { recursive: true }, (err) => {
			if (err) throw err;
		});

		fs.writeFileSync(`friends/${uid}/friends.json`, JSON.stringify(friends));
		var data = JSON.parse(fs.readFileSync(`friends/${uid}/friends.json`));
	}

	try{
		var frienddata = JSON.parse(fs.readFileSync(`friends/${friend}/friends.json`));
	}catch{
		let friends = {
			outgoing:[],
			confirmed:[],
			incoming:[]
		}
		fs.mkdirSync(`friends/${friend}`, { recursive: true }, (err) => {
			if (err) throw err;
		});
		fs.writeFileSync(`friends/${friend}/friends.json`, JSON.stringify(friends));
		var frienddata = JSON.parse(fs.readFileSync(`friends/${friend}/friends.json`));
	}

	if (frienddata.outgoing.includes(uid)){
		//add friends for both
		//clear firends outgoing and my incoming
		data.confirmed.push(friend);
		frienddata.confirmed.push(uid);
		data.incoming.splice(data.incoming.indexOf(friend),1);
		frienddata.outgoing.splice(frienddata.outgoing.indexOf(uid),1);
	} else if (frienddata.incoming.includes(uid)){
		//remove friend from friend incoming and my outgoing
		//cancel request
		data.outgoing.splice(data.outgoing.indexOf(friend),1);
		frienddata.incoming.splice(frienddata.incoming.indexOf(uid),1);
	} else if (frienddata.confirmed.includes(uid)){
		//remove friend for both
		//unfriend
		data.confirmed.splice(data.confirmed.indexOf(friend),1);
		frienddata.confirmed.splice(frienddata.confirmed.indexOf(uid),1);
	} else {
		//add to friends incoming, and my outgoing
		frienddata.incoming.push(uid);
		data.outgoing.push(friend);
	}

	fs.writeFileSync(`friends/${friend}/friends.json`, JSON.stringify(frienddata));
	fs.writeFileSync(`friends/${uid}/friends.json`, JSON.stringify(data));





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

	//res.redirect('back');
});




app.post("/avatar", async (req,res) => {

	if (checklogin(req,res)){
			if(!req.files) {
				res.send("no image attached");
				console.log("imsmsart")
			}
			else{
				try{
					var data = JSON.parse(fs.readFileSync(`friends/${uid}/friends.json`));
				}catch{ var data = {confirmed:[]}}

				res.render("home",{
					users:users,
					req:req,
					friends:data.confirmed
				});


				//console.log(req.files.avatar.data)
				let dir = `./uploads/${req.session.uid}`;

				let imgsize = sizeOf(req.files.avatar.data);
				//console.log(imgsize);

				if (imgsize.width>imgsize.height){
					global.mult = imgsize.width/40;
					//console.log("constant is set")
					console.log(mult);
				}
				else{
					global.mult = imgsize.height/40;
					//console.log("constant is set")
					console.log(mult);
				}	


				let width= parseInt(imgsize.width/global.mult);
				let height = parseInt(imgsize.height/global.mult);

				//console.log(width,height)

				
				sharp(req.files.avatar.data).resize({ height: height, width: width }).toFile(`./uploads/${req.session.uid}/avatar.png`)
				.then(function(newFileInfo) {
					console.log("Success")
				})
				.catch(function(err) {
					console.log(err);
				});



				//req.files.avatar.mv(`./uploads/${req.session.uid}/avatar.png`);
					
				console.log(`\n[user <${users[req.session.uid].user}> just updated their avatar]`);

			}

	}
});



/*
//LET USER CUSTOMISE AVATAR

app.post("/avatar", async (req,res) =>{

	function initparts(part){
		return fs.readdirSync(`avatar/${part}`);
	}

	const eyebrows = initparts("eyebrows");
	const eyes = initparts("eyes");
	const mouth = initparts("mouth");
	const nose = initparts("nose");


	parts = [eyebrows,eyes,nose,mouth]

	res.render("avatar", {
		req:req,
		parts:parts
	});

});


//save avatar

app.post("/saveavatar", async (req,res) => {


	let image = req.body.img;

	let uid = req.session.uid;


	var regex = /^data:.+\/(.+);base64,(.*)$/;

	var matches = image.match(regex);
	var ext = matches[1];
	var data = matches[2];
	var buffer = Buffer.from(data, 'base64');
	fs.writeFileSync(`uploads/${uid}/avatar.${ext}`, buffer);

	//const buffer = Buffer.from(image, "base64");
	//console.log(buffer)
	//fs.writeFileSync(`./uploads/${uid}/avatar.jpg`, buffer)

	
	//image.mv(`./uploads/${uid}/avatar.png`);
	res.render("home",{
					users:users,
					req:req
				});
	

});

*/




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




//edit description

app.post("/edit", (req, res) => {

	dir=`uploads/${req.session.uid}/${req.body.post.slice(0,-4)}.json`;
	console.log(`\nuser <${users[req.session.uid].user}> editing ${dir}`);
	let temp = JSON.parse(fs.readFileSync(dir));
	temp.desc=req.body.newdesc;
	fs.writeFileSync(dir, JSON.stringify(temp));

	res.send("updated desc");


});



//delete post

app.post("/delete-post", (req, res) => {

	dir=`uploads/${req.session.uid}/${req.body.post.slice(0,-4)}`;
	fs.rmSync(`${dir}.png`);
	fs.rmSync(`${dir}.json`);
	


});








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
	return newuser.uid;
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