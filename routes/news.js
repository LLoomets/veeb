const express = require('express');
const timeInfo = require('../src/datetime_en_et');
//loome oma rakenduse sees toimiva miniäpo
const router = express.Router(); //Suur algustäht "R" on OLULINE
const pool = require('../src/databasepool').pool;

//kuna siin on miniäpp router, siis kõik marsruudid on temaga, mitte app'ga seotud
//kuna kõik siinsed marsruudid alguvad "/news" , siis selle jätame ära

router.get('/', (req, res)=> {
    res.render('news');
    
});

router.get('/add', (req, res)=> {
    res.render('addnews');
    
});

router.post('/add', (req,res)=> {
    let notice = '';
    let sql = 'INSERT INTO vpnews (title, content, expire, userid) VALUES (?, ?, ?, 1)';

    pool.getConnection((err, conn)=>{
        if(err){
            throw err;
        }
        else{
            //andmebaasi osa
            conn.query(sql,[req.body.titleInput, req.body.contentInput, req.body.expireInput], (err, result)=>{
                if(err) {
                    notice = 'Uudise lisamine ebaõnnestus';
                    res.render('addnews', {notice: notice});
                    throw err;
                    conn.release();
                }
                else{
                    notice = 'Uudis on edukalt lisatud';
                    res.render('addnews', {notice: notice});
                    conn.release();
                }
            });
        }
    });
});

router.get('/read', (req, res)=> {
    let sqlDate = timeInfo.dateSQLformatted();
    let sql = 'SELECT * FROM vpnews WHERE expire >' + sqlDate + ' AND deleted IS NULL ORDER BY id DESC';
    let sqlResult = [];

    pool.getConnection((err, conn)=>{
        if(err){
            throw err;
        }
        else{
            //andmebaasi osa
            conn.query(sql, (err, result)=>{
                if(err) {
                    res.render('readnews', {readnews: sqlResult, sqlDateNow: sqlDate});
                    throw err;
                    //conn.release();
                }
                else {
                    console.log('loeme uudiseid');
                    //console.log(result);
                    res.render('readnews', {readnews: result, sqlDateNow: sqlDate});
                    //conn.release();
                }
            });
        }
    });
});


router.get('/read/:id', (req, res)=> {
    let sql = 'SELECT * FROM vpnews WHERE id = ? AND deleted IS NULL ORDER BY id DESC';
    let sqlResult = [];

    pool.getConnection((err, conn)=>{
        if(err){
            throw err;
        }
        else{
            //andmebaasi osa
            conn.query(sql, [req.params.id], (err, result) => {
                if (err) {
                    res.render('readnewsdata', {newsdata: sqlResult});
                    throw err;
                    //conn.release();
                }
                else {
                    res.render('readnewsdata', {newsdata: result[0]});
                    //conn.release();
                }
            });
        }
    });  
});

/* router.get('/news/read/:id/:lang', (req, res)=> {
    //res.render('readnews');
    console.log(req.params);
    console.log(req.query);
    res.send('Tahame uudist, mille id on: ' + req.params.id);
}); */

module.exports = router;