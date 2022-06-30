const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const app = express();
const fs = require('fs');

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(fileUpload({ createParentPath: true }));







//login request

app.post("/auth", (req, res) => {

	var found=false;
	for (i in users){
		if (req.body.user==users[i].user){
			found=true;
			if (req.body.pass==users[i].pass){
				res.send("hey, "+req.body.user+"!");
				console.log(`\n[user: <${users[i].user}> logged in]`);
				break;
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

	try{
		if(!req.files) {
			res.send("no image attached");
		}
		else{
			res.send(req.files.post);
			req.files.post.mv(`./uploads/${req.body.uid}/${req.files.post.name}`)
			console.log(`\n[user <${users[req.body.uid].user}> just posted!]  `)
		}
	} catch (err) {
		res.status(500).send(err);
	}

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
	let data = JSON.stringify(users);
	fs.writeFileSync("users.json", data);
}

