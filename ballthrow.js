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
    notice = '';
    let sql = 'SELECT participant_number, MAX(distance) AS best_result FROM competition GROUP BY participant_number ORDER BY best_result DESC LIMIT 3';
    pool.getConnection((err, conn)=>{
        if (err) {
            throw err;
            conn.release();
        } else {
            conn.execute(sql, (err, bestResult)=>{
                if (err) {
                    throw err;
                    conn.release();
                }
                //notice = 'Parimad osalejad leitud';
                res.render('ballthrow', {notice: notice, bestParticipants: bestResult});
                conn.release();
            });
        }
    });
});

app.post('/', (req, res) => {
    let notice = '';
    let selectSQL = 'SELECT participant_number, date, distance FROM competition WHERE participant_number = ? ORDER BY distance DESC';
    let insertSQL = 'INSERT INTO competition (participant_number, date, distance) VALUES (?,?,?)';
    let updateSQL = 'UPDATE competition SET distance = ? WHERE participant_number = ? AND date = ? AND distance < ?';
    const resultInput = parseFloat(req.body.throwDistanceInput);
    pool.getConnection((err, conn)=>{
        if(err) {
            throw err;
            conn.release();
        } else {
            conn.execute(updateSQL, [resultInput, req.body.participantNumInput, req.body.dateInput, resultInput], (err, updateResult)=>{
                if (err) {
                    throw err;
                    res.render('ballthrow', {notice: 'mingi error'});
                } else {
                    if(updateResult.affectedRows > 0) {
                        conn.execute(selectSQL, [req.body.participantNumInput], (err, result)=>{
                            if (err) {
                                notice = 'Ei saa kuvada andmeid';
                                res.render('singlethrow', {notice: notice});
                            } else {
                                if(result && result.length > 0) {
                                    notice = 'Andmed edukalt kuvatud';
                                    res.render('singlethrow', {playerInfo: result, notice:notice});
                                } else {
                                    notice = 'Võistleja puudub';
                                    res.render('singlethrow', {notice:notice});
                                }
                            }
                        });
                    } else {
                        conn.execute(insertSQL, [req.body.participantNumInput, req.body.dateInput, resultInput], (err, result) =>{
                            if (err) {
                                notice = 'Andmete salvestamine ebaõnnestus';
                                res.render('ballthrow', {notice:notice});
                                throw err;
                            } else {
                                conn.execute(selectSQL, [req.body.participantNumInput], (err, result)=>{
                                    if (err) {
                                        notice = 'Ei saa kuvada andmeid';
                                        res.render('singlethrow', {notice:notice});
                                    } else {
                                        if (result && result.length > 0) {
                                            notice = 'Andmed edukalt kuvatud';
                                            res.render('singlethrow', {playerInfo: result, notice:notice});
                                        } else {
                                            notice = 'Võistlejat ei leitud';
                                            res.render('singlethrow', {notice:notice});
                                        }
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
    });    
});



app.listen(5110)
