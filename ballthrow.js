const express = require('express');
const fs = require('fs');
const app = express();
//kui kõik db asjad pool'is, siis pole seda vaja
const mysql = require('mysql2');
const timeInfo = require('./src/datetime_en_et');
const bodyparser = require('body-parser');
//kui kõik db asjad pool'is, siis pole seda vaja
const dbInfo = require('../../vp23config.js');

const pool = require('./src/databasepool').pool; //saab aru et pool.pool on lihtsalt pool, muidu segane
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

//pildi tüübi jaoks (jpeg, png, gif)
//import fileType from 'file-type';


app.use(session({secret: 'minuAbsoluutseltSalajaneVõti', saveUninitialized: true, resave: true}));
let mySession;

app.set('view engine', 'ejs');
app.use(express.static('public'));
//Järgnev, kui ainult tekst, siis 'false', kui ka muud kraami nt pilti, siis'true'
app.use(bodyparser.urlencoded({extended: true}));



//loon andmebaasiühenduse
//kui kõik db asjad pool'is, siis pole seda vaja
const conn = mysql.createConnection({
    host: dbInfo.configData.host,
    user: dbInfo.configData.user,
    password: dbInfo.configData.password,
    database: dbInfo.configData.database
});


app.get('/', (req, res)=>{
    //console.log('app gettis');
    res.render('ballthrow');
});

app.post('/', (req, res)=>{
    let notice = '';
    let insertSQL = 'INSERT INTO competition (participant_number, date, distance) VALUES (?,?,?)';

    conn.execute(insertSQL,[req.body.participantNumInput, req.body.dateInput, req.body.throwDistanceInput], (err, result)=>{
        if(err){
            notice = 'Andmete lisamine ebaõnnestus';
            res.render('ballthrow', {notice: notice});
            throw err;
        }
        else{
            notice = 'Osaleja number ' + req.body.participantNumInput +  ' viskekaugusega ' + req.body.throwDistanceInput + ' meetrit lisamine õnnestus!';

            let selectSQL = 'SELECT date, distance FROM competition WHERE participant_number = ? ORDERED BY distance DESC';
            conn.execute(selectSQL, [req.body.participantNumInput, req.body.dateInput, req.body.throwDistanceInput], (err, result)=>{
                if(err){
                    console.log('no mida');
                    res.render('ballthrow');
                }
                else{
                    res.render('ballthrow',{notice: notice, ballthrow: result});
                }
            });
            
        }
    });
    
});



app.listen(5110)