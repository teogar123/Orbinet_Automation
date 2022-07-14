const loginPage = require('../page_objects/LoginPage');
const page = require('../page_objects/Page');
const companyRegisterPage = require('../page_objects/CompanyRegisterPage');
const userProfilePage = require('../page_objects/UserProfilePage');
const axios = require('axios');
const { browser } = require('protractor');

function RoutesLoaderPage () {
    

/**
 * 
 * 
 * @Description Functionsto create 
 * 
 */


beforeAll( function () {
   page.openUrl();
});


    this.routesLoaderFunction = async (route) => {
        var randomNumbers = Math.floor(Math.random() * 10000000);
        var monthRandomNumbers =   Math.floor(Math.random(4) * 12) +  1;
        var dayRandomNumbers = Math.floor(Math.random() * 30) + 1;
        console.log(monthRandomNumbers);
        console.log(dayRandomNumbers);
        console.log("2022-"+ monthRandomNumbers +   '-' + dayRandomNumbers);
        let tknum = "1703" + randomNumbers;
        
        var payload = {

        "token": "yCNtVJteysucc2xgaFXdBnJyRAWAjCuJkMMNc",
        "action": "insert",
        "data": [{
            "TKNUM": tknum,
            "TDLNR": "0010007538",
            "VSART": "X2",   //Array 10 Random Pick
            "AEDAT": "2022-"+ monthRandomNumbers +  '-' + dayRandomNumbers,
            "AEZET": "15:47:00",      //Last Update Hour
            "KNOTA": "2200302008",
            "KNOTZ": "1000003000",
            "SHTYP": "Z002",
            "ROUTE": route,
            "DPREG": "2022-03-05",
            "DPTEN": "1900-01-01",
            "SIGNI": "17032022" + randomNumbers,
            "ADD01": "",
            "ADD03": "TP04",   //Array 9 Random pick
            "NAME_TRANS": "ALDAFA",
            "UPREG": "12:00:00",
            "UPTEN": "00:00:01",
            "STTRG": "1",
            "TEXT1": "",
            "TEXT2": "",
            "TEXT3": "3105",
            "TEXT4": "{}[220131]|2|",
            "VBELN": "0415070587",
            "WERKS_O": "FW05",
            "WERKS_D": "PC05",
            "WBSTK_S": "C",
            "WBSTK_E": "",
            "LFIMG_P": 0.000,
            "SGE_S": "__C",
            "SGE_E": "",
            "ANZPK": "00000",
            "entregas": [],
            "F_ELIM": ""
        }]
    }

     
    const response = await axios.post('https://qa.v2.orbinetwork.com/api/v2/bridge/octopus/receiver', payload)
    .then(function(res) {
        console.log('Here');
        console.log(res.data)
})
    .catch(function(err) {
        console.log('fail'); 
        console.log(err.status);
});
    
return payload;
    
    }

        this.routesModifierFunction = async (payload) => {
            var randomNumbers = Math.floor(Math.random() * 1000);
            var monthRandomNumbers =   Math.floor(Math.random(3) * 12) + 1;
            var dayRandomNumbers = Math.floor(Math.random() * 30) + 1;
            console.log(monthRandomNumbers);
            //console.log(dayRandomNumbers);
            //console.log("2022-"+ monthRandomNumbers +   '-' + dayRandomNumbers);

/*var payload = {

   "token": "yCNtVJteysucc2xgaFXdBnJyRAWAjCuJkMMNc",
   "action": "insert",
   "data": [{
       "TKNUM": tknum,
       "TDLNR": "0010007538",
       "VSART": "X2",   //Array 10 Random Pick
       "AEDAT": "2022-"+ monthRandomNumbers +  '-' + dayRandomNumbers,
       "AEZET": "15:47:00",      //Last Update Hour
       "KNOTA": "2200302008",
       "KNOTZ": "1000003000",
       "SHTYP": "Z002",
       "ROUTE": "244300",
       "DPREG": "2022-03-05",
       "DPTEN": "1900-01-01",
       "SIGNI": "17032022" + randomNumbers,
       "ADD01": "",
       "ADD03": "TP04",   //Array 9 Random pick
       "NAME_TRANS": "ALDAFA",
       "UPREG": "12:00:00",
       "UPTEN": "00:00:01",
       "STTRG": "1",
       "TEXT1": "",
       "TEXT2": "",
       "TEXT3": "3105",
       "TEXT4": "{}[220131]|2|",
       "VBELN": "0415070587",
       "WERKS_O": "FW05",
       "WERKS_D": "PC05",
       "WBSTK_S": "C",
       "WBSTK_E": "",
       "LFIMG_P": 0.000,
       "SGE_S": "__C",
       "SGE_E": "",
       "ANZPK": "00000",
       "entregas": [],
       "F_ELIM": ""
   }]
}*/

payload['data'][0]["entregas"] = [{
    "TKNUM_V": "0014689466",
    "VBELN": "0415286884",
    "MATNR": "000000000002000393",
    "GEWEI_NET": "TON",
    "LFART_ES": "E",
    "MEINS": "CA",
    "VOLEH": "CCM",
    "NTGEW": 11.837,
    "FCONT_ENT": "",
    "LFIMG": 2430.000,
    "BRGEW": 11.837,
    "ARKTX": "ENVASE COR VICT AMB PAPEL 24 210ML",
    "VOLUM": 21089.970,
    "GEWEI": "TON",
    "FCONT_SAL": dayRandomNumbers + '.' + monthRandomNumbers + '.2022' + ' 00:00:00',
    "VGBEL": "4511142124"
    }]
        
    const response = await axios.post('https://qa.v2.orbinetwork.com/api/v2/bridge/octopus/receiver', payload)     
        .then(function(res) {
            //console.log(payload);
            //console.log(payload['data'][0]['entregas']);
            console.log('');
            console.log(res.data)
   })
        .catch(function(err) {
            console.log('fail-1'); 
            console.log(err.data);
   });
   
    }    
       
    
};
module.exports = new RoutesLoaderPage();