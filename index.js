const express = require('express');
const fs = require('fs');
const app = express();
const mysql = require('mysql2');
const timeInfo = require('./datetime_en_et');
const bodyparser = require('body-parser');
const dbInfo = require('../../vp23config.js');
//fotode laadimiseks
const multer = require('multer');
//seadistame vahevara (middleware), mis määrab üleslaadimise kataloogi
const upload = multer({dest: '.public/gallery/orig/'});
const sharp = require('sharp');
const async = require('async');
//paroolide krüpteerimiseks
const bcrypt = require('bcrypt');
//sessiooni jaoks
const session = require('express-session');

app.use(session({secret: 'minuAbsoluutseltSalajaneVõti', saveUninitialized: true, resave: true}));
let mySession;

app.set('view engine', 'ejs');
app.use(express.static('public'));
//Järgnev, kui ainult tekst, siis 'false', kui ka muud kraami nt pilti, siis'true'
app.use(bodyparser.urlencoded({extended: true}));

//loon andmebaasiühenduse
const conn = mysql.createConnection({
    host: dbInfo.configData.host,
    user: dbInfo.configData.user,
    password: dbInfo.configData.password,
    database: dbInfo.configData.database
});

app.get('/', (req, res)=>{
    let notice = 'Sisesta oma kasutajakonto andmed!';
    //res.send('See töötab!');
    //res.download('index.js');
    res.render('index', {notice: notice});
});

app.post('/', (req, res)=>{
    let notice = 'Sisesta oma kasutajakonto andmed!';
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log('Paha');
		res.render('index', {notice: notice});
	}
	else {
		console.log('Hea');
		let sql = 'SELECT password FROM vpusers WHERE email = ?';
		conn.execute(sql, [req.body.emailInput], (err, result)=>{
			if(err) {
				notice = 'Tehnilise vea tõttu ei saa sisse logida!';
				console.log(notice);
				res.render('index', {notice: notice});
			}
			else {
				//console.log(result);
				if(result[0] != null){
					console.log(result[0].password);
					bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
						if(err){
								throw err;
						}
						else {
							if(compareresult){
                                mySession = req.session;
                                mySession.userName = req.body.emailInput;
                                
                                notice = mySession.userName + ' on sisse loginud';
								console.log(notice);

								res.render('index', {notice: notice});
							}
							else {
								notice = 'Kasutajatunnus või parool oli vigane!';
								console.log(notice);
								res.render('index', {notice: notice});
							}
						}
					});
				
				}
				else {
					notice = 'Kasutajatunnus või parool oli vigane!';
					console.log(notice);
					res.render('index', {notice: notice});
				}
				
			}
		});
		//res.render('index', {notice: notice});
	}
});

app.get('/logout', (req, res)=>{
    req.session.destroy();
    mySession = null;
    console.log('Logi välja');
    res.redirect('/');
});


app.get('/signup', (req, res)=>{
    res.render('signup');
});

app.post('/signup', (req, res)=>{
    let notice = 'Ootan andmeid!';
    console.log(req.body)
    if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.genderInput || !req.body.birthInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput) { //! alguses on EITUS
        console.log('Andmeid on puudu või ei ole korrektsed!');
        notice = 'Andmeid on puudu või ei ole korrektsed!';
        res.render('signup', {notice: notice});
    }
    else{
        console.log('OK!');
        bcrypt.genSalt(10, (err, salt)=> {
            bcrypt.hash(req.body.passwordInput, salt, (err, pwdhash)=> {
                let sql = 'INSERT INTO vpusers (firstname, lastname, birthdate, gender, email, password) VALUES(?,?,?,?,?,?)';
                conn.execute(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthInput, req.body.genderInput, req.body.emailInput, pwdhash], (err, result)=>{
                    if(err) {
                        console.log(err);
                        notice = 'Tehnilistel põhjustel kasutajat ei loodud!';
                        res.render('signup', {notice: notice});

                    }
                    else {
                        console.log('Kasutaja loodud!')
                        notice = 'Kasutaja ' + req.body.emailInput + 'edukalt loodud!';
                        res.render('signup', {notice: notice});
                    }
                });
            });
        });
    }
    //res.render('signup');
});

app.get('/timenow', (req, res)=>{
    const dateNow = timeInfo.dateETformatted();
    const timeNow = timeInfo.timeETformatted();
    //res.render('timenow');
    res.render('timenow', {nowD: dateNow, nowT: timeNow});
});

app.get('/wisdom', (req, res)=>{
    let folkWisdom = [];
    fs.readFile('public/txtfiles/vanasonad.txt', 'utf8', (err, data)=>{
        if(err){
            throw err;
        }
        else {
            folkWisdom = data.split(';');
            res.render('justlist', {h1: 'Vanasõnad', wisdom: folkWisdom});
        }
    });
});

app.get('/names', (req, res)=>{
    let peopleNames = [];
    fs.readFile('public/txtfiles/log.txt', 'utf8', (err, data)=>{
        if(err){
            throw err;
        }
        else {
            peopleNames = data.replaceAll(',', ' ').split(';');
            //Kontrollib kas viimane element on tühi ja eemaldab
            if (peopleNames[peopleNames.length - 1] === '') {
                peopleNames.pop();
            }
            res.render('namelist', {h1: 'Nimed', names: peopleNames});
        }
    });
});

app.get('/eestifilm', (req, res)=>{
    res.render('filmindex');
});



app.get('/eestifilm/filmiloend', (req, res)=>{
    let sql = 'SELECT title, production_year, duration FROM movie';
    let sqlResult = [];

    conn.query(sql, (err, result)=>{
        if (err) {
            res.render('filmlist', {filmlist: sqlResult});
            //conn.end();
            throw err;
        }
        else {
            //console.log(result);
            res.render('filmlist', {filmlist: result});
            //conn.end();
        }
    });
});

app.get('/eestifilm/addfilmperson', (req, res)=>{
    res.render('addfilmperson');
});

app.post('/eestifilm/addfilmperson', (req, res)=>{
    //res.render('addfilmperson');
    //res.send(req.body);
    let notice = '';
    let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES (?,?,?)';
    conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result)=>{
        if (err) {
            notice = 'Andmete salvestamine ebaõnnestus!';
            res.render('addfilmperson', {notice: notice});
            throw err;
        }
        else {
            notice = req.body.firstNameInput + ' ' + req.body.lastNameInput + ' salvestamine õnnestus!';
            res.render('addfilmperson', {notice: notice});
        }
    });
});

app.get('/eestifilm/singlefilm', (req, res)=>{
    let sql = 'SELECT COUNT(id) AS max FROM movie';
    let sqlResult = [];
    conn.query(sql, (err, result) => {
        if (err) {
            res.render('singlefilm');
            throw err;
        }
        else {
            res.render('singlefilm', {filmcount: result[0]['max']});
        }
    })
});

app.post('/eestifilm/singlefilm', (req, res)=>{
    //console.log("POST");
    let notice= '';
    let sql = 'SELECT * FROM movie WHERE id=?';
    let sqlResult = [];
    conn.query(sql, [req.body.filmNumberInput], (err, result) => {
        if (err) {
            notice = 'Filmi andmed ei leitud!';
            res.render('singlefilmlist', {filmdata: sqlResult, notice: notice});
            throw err;
        }
        else {
            notice = 'Film leitud!';
            res.render('singlefilmlist', {filmdata: result, notice: notice});
        }
    });
});

app.get('/eestifilm/addfilmrelation', (req, res)=>{
    //kasutades async moodulit paneme mitu tegevust paralleelselt tööle
    //kõigepealt loome tegevuste loendi
    const myQuerys = [
        function(callback){
            conn.execute('SELECT id, first_name, last_name FROM person', (err, result)=> {
                if(err) {
                    return callback(err);
                }
                else {
                    return callback(null, result);
                }
            });
        },
        function(callback) {
            conn.execute('SELECT id, title FROM movie', (err, result)=> {
                if(err) {
                    return callback(err);
                }
                else {
                    return callback(null, result);
                }
            });
        }// veel , ja järgmine function jne
    ];
    //paneme kõik need tegevused paralleelselt tööle, tulemuseks list (array) ühistest tulemustest
    async.parallel(myQuerys, (err, results)=> {
        if(err) {
            throw err;
        }
        else {
            //siin kõik asjad mis on vaja teha
            console.log(results)
        }
    });
    res.render('addfilmrelation')
});

app.get('/news', (req, res)=> {
    res.render('news');
    
});

app.get('/news/add', (req, res)=> {
    res.render('addnews');
    
});

app.post('/news/add', (req,res)=> {
    let notice = '';
    let sql = 'INSERT INTO vpnews (title, content, expire, userid) VALUES (?, ?, ?, 1)';
    conn.query(sql,[req.body.titleInput, req.body.contentInput, req.body.expireInput], (err, result)=>{
        if(err) {
            notice = 'Uudise lisamine ebaõnnestus';
            res.render('addnews', {notice: notice});
            throw err;
        }
        else{
            notice = 'Uudis on edukalt lisatud';
            res.render('addnews', {notice: notice});
        }
    });
});

app.get('/news/read', (req, res)=> {
    let sqlDate = timeInfo.dateSQLformatted();
    let sql = 'SELECT * FROM vpnews WHERE expire >' + sqlDate + ' AND deleted IS NULL ORDER BY id DESC';
    let sqlResult = [];
    conn.query(sql, (err, result)=>{
        if(err) {
            res.render('readnews', {readnews: sqlResult, sqlDateNow: sqlDate});
            throw err;
        }
        else {
            console.log('loeme uudiseid');
            //console.log(result);
            res.render('readnews', {readnews: result, sqlDateNow: sqlDate});
        }
    });
});


app.get('/news/read/:id', (req, res)=> {
    let sql = 'SELECT * FROM vpnews WHERE id = ? AND deleted IS NULL ORDER BY id DESC';
    let sqlResult = [];
    conn.query(sql, [req.params.id], (err, result) => {
        if (err) {
            res.render('readnewsdata', {newsdata: sqlResult});
            throw err;
        }
        else {
            res.render('readnewsdata', {newsdata: result[0]});
        }
    });  
});

/* app.get('/news/read/:id/:lang', (req, res)=> {
    //res.render('readnews');
    console.log(req.params);
    console.log(req.query);
    res.send('Tahame uudist, mille id on: ' + req.params.id);
}); */

app.get('/photoupload', checkLogin, (req,res)=>{   //checklogin vahevara, kõigepealt saadetakse vahevarale
    res.render('photoupload');
});

app.post('/photoupload', upload.single('photoInput'), (req, res)=>{
    let notice = '';
	console.log(req.file);
	console.log(req.body);
    const fileName = 'vp_' + Date.now() + '.jpg';
	/* fs.rename(req.file.path, './public/gallery/orig/' + req.file.originalname, (err)=>{
		console.log('Faili laadimise viga: ' + err);
	}); */
    fs.rename(req.file.path, './public/gallery/orig/' + fileName, (err)=>{
		console.log('Faili laadimise viga: ' + err);
	});
    //loome kaks väiksema mõõduga pildi varianti
    sharp('./public/gallery/orig/' + fileName).resize(100,100).jpeg({quality : 90}).toFile('./public/gallery/thumbs/' + fileName);
    sharp('./public/gallery/orig/' + fileName).resize(800,600).jpeg({quality : 90}).toFile('./public/gallery/normal/' + fileName);

    //foto andmed andmetabelisse
    let sql = 'INSERT INTO vpgallery (filename, originalname, alttext, privacy, userid) VALUES(?,?,?,?,?)';
    const userid = 1;
    conn.execute(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userid], (err, result)=>{
        if (err) {
            notice = 'Foto andmete salvestamine ebaõnnestus';
            res.render('photoupload', {notice: notice});
            throw err;
        }
        else {
            notice = 'Foto ' + req.file.originalname + ' laeti edukalt üles!';
            res.render('photoupload', {notice: notice});
        }
    });
});

//andmebaasist tuleb lugeda piltide id, filename ja alttext
app.get('/photogallery', (req,res)=>{
    let sql = 'SELECT * FROM vpgallery WHERE deleted IS NULL ORDER BY id DESC';
    let sqlResult = [];
    conn.execute(sql, (err, result)=>{
        if(err) {
            res.render('photogallery', {photoList: sqlResult});
            throw err;
        }
        else {
            //console.log(result)
            res.render('photogallery', {photoList: result});
        }
    }); 
});

function checkLogin(req, res, next){
    console.log('kontrollime sisselogimist');
    if(req.mySession !== null){
        if(mySession.userName){
            console.log('Täitsa see on!');
            next();
        }
        else {
            console.log('Ei ole üldse see');
            res.redirect('/');
        }
    }
    else {
        res.redirect('/');
    }
}

app.listen(5110);