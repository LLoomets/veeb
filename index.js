const express = require('express');
const fs = require('fs');
const app = express();
const mysql = require('mysql2');
const timeInfo = require('./datetime_en_et');
const bodyparser = require('body-parser');
const dbInfo = require('../../vp23config.js');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

//loon andmebaasiühenduse
const conn = mysql.createConnection({
    host: dbInfo.configData.host,
    user: dbInfo.configData.user,
    password: dbInfo.configData.password,
    database: dbInfo.configData.database
});

app.get('/', (req, res)=>{
    //res.send('See töötab!');
    //res.download('index.js');
    res.render('index');
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


app.listen(5110);